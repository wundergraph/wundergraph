package node

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/pires/go-proxyproto"
	"github.com/valyala/fasthttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/sync/errgroup"
	"golang.org/x/time/rate"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/httpidletimeout"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node/nodetemplates"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/validate"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	rootEndpoint        = "/"
	healthCheckEndpoint = "/health"
)

func New(ctx context.Context, info BuildInfo, wundergraphDir string, log *zap.Logger) *Node {
	return &Node{
		info:           info,
		ctx:            ctx,
		configCh:       make(chan WunderNodeConfig),
		pool:           pool.New(),
		log:            log.With(zap.String("component", "@wundergraph/node")),
		WundergraphDir: wundergraphDir,
		apiClient: &fasthttp.Client{
			ReadTimeout:              time.Second * 10,
			WriteTimeout:             time.Second * 10,
			MaxIdleConnDuration:      time.Minute * 5,
			MaxConnDuration:          time.Minute * 10,
			MaxConnsPerHost:          100,
			DialDualStack:            true,
			NoDefaultUserAgentHeader: true,
		},
	}
}

type Node struct {
	ctx            context.Context
	info           BuildInfo
	configCh       chan WunderNodeConfig
	server         *http.Server
	pool           *pool.Pool
	log            *zap.Logger
	apiClient      *fasthttp.Client
	options        options
	WundergraphDir string
}

type options struct {
	staticConfig        *WunderNodeConfig
	fileSystemConfig    *string
	enableDebugMode     bool
	forceHttpsRedirects bool
	enableIntrospection bool
	configFileChange    chan struct{}
	globalRateLimit     struct {
		enable      bool
		requests    int
		perDuration time.Duration
	}
	disableGracefulShutdown bool
	insecureCookies         bool
	githubAuthDemo          GitHubAuthDemo
	devMode                 bool
	idleTimeout             time.Duration
	idleHandler             func()
	hooksServerHealthCheck  bool
	healthCheckTimeout      time.Duration
	prettyLogging           bool
}

type Option func(options *options)

func WithHooksServerHealthCheck(timeout time.Duration) Option {
	return func(options *options) {
		options.hooksServerHealthCheck = true
		options.healthCheckTimeout = timeout
	}
}

func WithStaticWunderNodeConfig(config WunderNodeConfig) Option {
	return func(options *options) {
		options.staticConfig = &config
	}
}

func WithGitHubAuthDemo(authDemo GitHubAuthDemo) Option {
	return func(options *options) {
		options.githubAuthDemo = authDemo
	}
}

// WithDevMode will set cookie secrets to a static, insecure, string
// This way, you stay logged in during development
// Should never be used in production
func WithDevMode() Option {
	return func(options *options) {
		options.devMode = true
	}
}

func WithInsecureCookies() Option {
	return func(options *options) {
		options.insecureCookies = true
	}
}

func WithIntrospection(enable bool) Option {
	return func(options *options) {
		options.enableIntrospection = enable
	}
}

func WithGlobalRateLimit(requests int, perDuration time.Duration) Option {
	return func(options *options) {
		options.globalRateLimit.enable = true
		options.globalRateLimit.requests = requests
		options.globalRateLimit.perDuration = perDuration
	}
}

func WithFileSystemConfig(configFilePath string) Option {
	return func(options *options) {
		options.fileSystemConfig = &configFilePath
	}
}

func WithConfigFileChange(event chan struct{}) Option {
	return func(options *options) {
		options.configFileChange = event
	}
}

func WithDebugMode(enable bool) Option {
	return func(options *options) {
		options.enableDebugMode = enable
	}
}

func WithPrettyLogging(enable bool) Option {
	return func(options *options) {
		options.prettyLogging = enable
	}
}

func WithForceHttpsRedirects(forceHttpsRedirects bool) Option {
	return func(options *options) {
		options.forceHttpsRedirects = forceHttpsRedirects
	}
}

// WithIdleTimeout makes the Node call the given handler after idleTimeout
// has elapsed without any requests while the server is running. If there
// are no requests, the handler will be called after idleTimeout counting
// from the server start.
func WithIdleTimeout(idleTimeout time.Duration, idleHandler func()) Option {
	return func(options *options) {
		options.idleTimeout = idleTimeout
		options.idleHandler = idleHandler
	}
}

func (n *Node) StartBlocking(opts ...Option) error {
	var options options
	for i := range opts {
		opts[i](&options)
	}

	n.options = options

	g := errgroup.Group{}

	switch {
	case options.staticConfig != nil:
		n.log.Info("Api config: static")

		g.Go(func() error {
			err := n.startServer(*options.staticConfig)
			if err != nil {
				n.log.Error("could not start a node",
					zap.Error(err),
				)
				return err
			}
			return nil
		})
	case options.fileSystemConfig != nil:
		n.log.Info("Api config: file polling",
			zap.String("config_file_name", *options.fileSystemConfig),
		)
		if options.configFileChange != nil {
			g.Go(func() error {
				err := n.reconfigureOnConfigUpdate()
				if err != nil {
					n.log.Error("could not reconfigure config update",
						zap.Error(err),
					)
					return err
				}
				return nil
			})

			g.Go(func() error {
				err := n.filePollConfig(*options.fileSystemConfig)
				if err != nil {
					n.log.Error("could not load config",
						zap.Error(err),
					)
					return err
				}
				return nil
			})
		}
	default:
		return errors.New("could not start a node. no config present")
	}

	return g.Wait()
}

func (n *Node) Shutdown(ctx context.Context) error {
	if n.server != nil {
		return n.server.Shutdown(ctx)
	}
	return nil
}

func (n *Node) Close() error {
	if n.server != nil {
		return n.server.Close()
	}
	return nil
}

func (n *Node) newListeners(configuration *apihandler.Listener) ([]net.Listener, error) {
	cfg := net.ListenConfig{
		KeepAlive: 90 * time.Second,
	}

	host, port := configuration.Host, configuration.Port

	var listeners []net.Listener
	var localhostIPs []net.IP

	// If listening to 'localhost', listen to both 127.0.0.1 or ::1 if they are available.
	if host == "localhost" {
		localhostIPs, _ = net.LookupIP(host)
	}

	for _, ip := range localhostIPs {
		nip := ip.String()
		// isIPv6
		if strings.Contains(nip, ":") {
			listener, err := cfg.Listen(context.Background(), "tcp6", fmt.Sprintf("[%s]:%d", nip, port))
			// in some cases e.g when ipv6 is not enabled in docker, listen will error
			// in that case we ignore this error and try to listen to next ip
			if err == nil {
				listeners = append(listeners, &proxyproto.Listener{
					Listener: listener,
				})
			} else {
				n.log.Error("failed to listen to ipv6. Did you forget to enable ipv6?",
					zap.String("ip", nip),
					zap.Error(err),
				)
			}
		} else {
			listener, err := cfg.Listen(context.Background(), "tcp4", fmt.Sprintf("%s:%d", nip, port))
			if err != nil {
				return nil, err
			}
			listeners = append(listeners, &proxyproto.Listener{
				Listener: listener,
			})
		}
	}

	// when we didn't listen to additional localhostIPs we will listen only to the host
	if len(localhostIPs) == 0 {
		listener, err := cfg.Listen(context.Background(), "tcp", fmt.Sprintf("%s:%d", host, port))
		if err != nil {
			return nil, err
		}
		listeners = append(listeners, &proxyproto.Listener{
			Listener: listener,
		})
	}

	return listeners, nil
}

func (n *Node) HandleGracefulShutdown(gracefulTimeoutInSeconds int) {
	<-n.ctx.Done()

	n.log.Info("Initialize WunderNode shutdown ....")

	gracefulTimeoutDur := time.Duration(gracefulTimeoutInSeconds) * time.Second
	n.log.Info("Graceful shutdown WunderNode ...", zap.String("gracefulTimeout", gracefulTimeoutDur.String()))
	shutdownCtx, cancel := context.WithTimeout(context.Background(), gracefulTimeoutDur)
	defer cancel()

	if err := n.Shutdown(shutdownCtx); err != nil {
		n.log.Error("Error during WunderNode shutdown", zap.Error(err))
	}

	n.log.Info("WunderNode shutdown complete")
}

func (n *Node) GetHealthReport(hooksClient *hooks.Client) (*HealthCheckReport, bool) {
	healthCheck := &HealthCheckReport{
		ServerStatus: "NOT_READY",
		// For now we assume that the server is ready
		// because we don't have any health checks
		NodeStatus: "READY",
		BuildInfo:  n.info,
	}

	if n.options.hooksServerHealthCheck {
		ok := hooksClient.DoHealthCheckRequest(n.options.healthCheckTimeout)
		if ok {
			healthCheck.ServerStatus = "READY"
		} else {
			return healthCheck, false
		}
	} else {
		healthCheck.ServerStatus = "SKIP"
	}

	return healthCheck, true
}

func (n *Node) startServer(nodeConfig WunderNodeConfig) error {
	logLevel := nodeConfig.Api.Options.Logging.Level
	if n.options.enableDebugMode {
		logLevel = zapcore.DebugLevel
	}

	n.log = logging.
		New(n.options.prettyLogging, n.options.enableDebugMode, logLevel).
		With(zap.String("component", "@wundergraph/node"))

	router := mux.NewRouter()

	internalRouter := router.PathPrefix("/internal").Subrouter()

	if n.options.globalRateLimit.enable {
		limiter := rate.NewLimiter(rate.Every(n.options.globalRateLimit.perDuration), n.options.globalRateLimit.requests)
		router.Use(func(handler http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if !limiter.Allow() {
					http.Error(w, "too many requests", http.StatusTooManyRequests)
					return
				}
				handler.ServeHTTP(w, r)
			})
		})
	}

	var streamClosers []chan struct{}

	n.setApiDevConfigDefaults(nodeConfig.Api)

	valid, messages := validate.ApiConfig(nodeConfig.Api)

	if !valid {
		n.log.Error("API config invalid",
			zap.Strings("errors", messages),
		)
		return errors.New("API config invalid")
	}

	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 90 * time.Second,
	}

	defaultTransport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return dialer.DialContext(ctx, network, addr)
		},
		ForceAttemptHTTP2:   true,
		MaxIdleConns:        1024,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
	}

	serverUrl := strings.TrimSuffix(nodeConfig.Api.Options.ServerUrl, "/")

	hooksClient := hooks.NewClient(serverUrl, n.log)

	transportFactory := apihandler.NewApiTransportFactory(nodeConfig.Api, hooksClient, n.options.enableDebugMode)

	n.log.Debug("http.Client.Transport",
		zap.Bool("enableDebugMode", n.options.enableDebugMode),
	)

	loader := engineconfigloader.New(n.WundergraphDir, engineconfigloader.NewDefaultFactoryResolver(
		transportFactory,
		defaultTransport,
		n.options.enableDebugMode,
		n.log,
		hooksClient,
	))

	builderConfig := apihandler.BuilderConfig{
		InsecureCookies:            n.options.insecureCookies,
		ForceHttpsRedirects:        n.options.forceHttpsRedirects,
		EnableDebugMode:            n.options.enableDebugMode,
		EnableIntrospection:        n.options.enableIntrospection,
		GitHubAuthDemoClientID:     n.options.githubAuthDemo.ClientID,
		GitHubAuthDemoClientSecret: n.options.githubAuthDemo.ClientSecret,
		HookServerURL:              serverUrl,
		DevMode:                    n.options.devMode,
	}

	builder := apihandler.NewBuilder(n.pool, n.log, loader, hooksClient, builderConfig)
	internalBuilder := apihandler.NewInternalBuilder(n.pool, n.log, loader)

	publicClosers, err := builder.BuildAndMountApiHandler(n.ctx, router, nodeConfig.Api)
	if err != nil {
		n.log.Error("BuildAndMountApiHandler", zap.Error(err))
	}
	streamClosers = append(streamClosers, publicClosers...)

	internalClosers, err := internalBuilder.BuildAndMountInternalApiHandler(n.ctx, internalRouter, nodeConfig.Api)
	if err != nil {
		n.log.Error("BuildAndMountInternalApiHandler", zap.Error(err))
	}

	streamClosers = append(streamClosers, internalClosers...)

	defer func() {
		for _, closer := range streamClosers {
			close(closer)
		}
	}()

	router.Handle(rootEndpoint, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		template, err := nodetemplates.GetTemplateByPath(rootEndpoint)
		if err != nil {
			n.log.Error("GetTemplateByPath", zap.Error(err))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		report, healthy := n.GetHealthReport(hooksClient)
		if !healthy {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Content-Type", "text/html")

		if err := template.Execute(w, report); err != nil {
			n.log.Error("template.Execute", zap.Error(err))
			return
		}
	}))

	router.Handle(healthCheckEndpoint, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		report, healthy := n.GetHealthReport(hooksClient)
		if !healthy {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		_ = json.NewEncoder(w).Encode(report)
	}))

	n.server = &http.Server{
		Handler: router,
		ConnContext: func(ctx context.Context, c net.Conn) context.Context {
			return context.WithValue(ctx, "conn", c)
		},
		// ErrorLog: log.New(ioutil.Discard, "", log.LstdFlags),
	}

	if n.options.idleTimeout > 0 {
		opts := []httpidletimeout.Option{
			httpidletimeout.WithSkip(func(r *http.Request) bool {
				return r.URL.Path == healthCheckEndpoint
			}),
		}
		timeoutMiddleware := httpidletimeout.New(n.options.idleTimeout, opts...)
		router.Use(timeoutMiddleware.Handler)
		n.server.RegisterOnShutdown(timeoutMiddleware.Cancel)
		timeoutMiddleware.Start()
		go func() {
			timeoutMiddleware.Wait(n.ctx)
			n.options.idleHandler()
		}()
	}

	listeners, err := n.newListeners(nodeConfig.Api.Options.Listener)
	if err != nil {
		return err
	}

	g, _ := errgroup.WithContext(n.ctx)

	for _, listener := range listeners {
		l := listener
		g.Go(func() error {
			n.log.Info("listening on",
				zap.String("addr", l.Addr().String()),
			)

			if err := n.server.Serve(l); err != nil {
				if err == http.ErrServerClosed {
					n.log.Debug("listener closed",
						zap.String("addr", l.Addr().String()),
					)
					return nil
				}
				return err
			}
			return nil
		})
	}

	n.log.Debug("public node url",
		zap.String("publicNodeUrl", nodeConfig.Api.Options.PublicNodeUrl),
	)

	return g.Wait()
}

// setApiDevConfigDefaults sets default values for the api config in dev mode
func (n *Node) setApiDevConfigDefaults(api *apihandler.Api) {
	if n.options.devMode {

		// we set these values statically so that auth never drops login sessions during development
		if api.AuthenticationConfig != nil && api.AuthenticationConfig.CookieBased != nil {
			if csrfSecret := loadvariable.String(api.AuthenticationConfig.CookieBased.CsrfSecret); csrfSecret == "" {
				api.AuthenticationConfig.CookieBased.CsrfSecret = &wgpb.ConfigurationVariable{
					Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
					StaticVariableContent: "aaaaaaaaaaa",
				}
			}

			if blockKey := loadvariable.String(api.AuthenticationConfig.CookieBased.BlockKey); blockKey == "" {
				api.AuthenticationConfig.CookieBased.BlockKey = &wgpb.ConfigurationVariable{
					Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
					StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				}
			}

			if hashKey := loadvariable.String(api.AuthenticationConfig.CookieBased.HashKey); hashKey == "" {
				api.AuthenticationConfig.CookieBased.HashKey = &wgpb.ConfigurationVariable{
					Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
					StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				}
			}
		}

	}
}

func (n *Node) filterHosts(api apihandler.Api) []string {
	hosts := []string{api.PrimaryHost}
WithNext:
	for _, host := range api.Hosts {
		for _, existing := range hosts {
			if host == existing {
				continue WithNext
			}
		}
		hosts = append(hosts, host)
	}
	var filtered []string
	for _, host := range hosts {
		switch host {
		case "":
			continue
		default:
			filtered = append(filtered, host)
		}
	}
	return filtered
}

func (n *Node) reconfigureOnConfigUpdate() error {
	g, ctx := errgroup.WithContext(n.ctx)

	for {
		select {
		case config := <-n.configCh:
			n.log.Debug("Updated config -> (re-)configuring server")
			_ = n.Close()

			// in a new routine, startServer is blocking
			g.Go(func() error {
				err := n.startServer(config)
				if err != nil {
					return err
				}
				return nil
			})

		case <-ctx.Done():
			return g.Wait()
		}
	}
}

func (n *Node) filePollConfig(filePath string) error {
	for {
		select {
		case <-n.ctx.Done():
			return nil
		case _, ok := <-n.options.configFileChange:
			if !ok {
				return nil
			}
			err := n.reloadFileConfig(filePath)
			if err != nil {
				return err
			}
		}
	}
}

func (n *Node) reloadFileConfig(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		n.log.Error("reloadFileConfig ioutil.ReadFile", zap.String("filePath", filePath), zap.Error(err))
		return err
	}
	if len(data) == 0 {
		return errors.New("empty config file")
	}
	var graphConfig wgpb.WunderGraphConfiguration
	err = json.Unmarshal(data, &graphConfig)
	if err != nil {
		n.log.Error("reloadFileConfig json.Unmarshal", zap.String("filePath", filePath), zap.Error(err))
		return err
	}

	config, err := CreateConfig(&graphConfig)
	if err != nil {
		n.log.Error("reloadFileConfig CreateConfig", zap.String("filePath", filePath), zap.Error(err))
		return err
	}

	n.configCh <- config

	return nil
}

func uniqueStrings(slice []string) []string {
	keys := make(map[string]bool)
	var list []string
	for _, entry := range slice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}
