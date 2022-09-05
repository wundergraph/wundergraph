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

	"github.com/jensneuse/abstractlogger"
	"github.com/pires/go-proxyproto"
	"github.com/valyala/fasthttp"
	"golang.org/x/time/rate"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/types/go/wgpb"

	"github.com/libp2p/go-reuseport"

	"github.com/gorilla/mux"
)

func New(ctx context.Context, info BuildInfo, log abstractlogger.Logger) *Node {
	return &Node{
		info:     info,
		ctx:      ctx,
		errCh:    make(chan error),
		configCh: make(chan WunderNodeConfig),
		pool:     pool.New(),
		log:      log,
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
	ctx  context.Context
	info BuildInfo

	stopped  bool
	errCh    chan error
	configCh chan WunderNodeConfig

	server *http.Server

	pool *pool.Pool
	log  abstractlogger.Logger

	apiClient *fasthttp.Client

	options options
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
}

type Option func(options *options)

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

func WithForceHttpsRedirects(forceHttpsRedirects bool) Option {
	return func(options *options) {
		options.forceHttpsRedirects = forceHttpsRedirects
	}
}

func (n *Node) StartBlocking(opts ...Option) error {
	var options options
	for i := range opts {
		opts[i](&options)
	}

	n.options = options

	switch {

	case options.staticConfig != nil:
		n.log.Info("Api config: static")
		go n.startServer(*options.staticConfig)
	case options.fileSystemConfig != nil:
		n.log.Info("Api config: file polling",
			abstractlogger.String("config_file_name", *options.fileSystemConfig),
		)
		if options.configFileChange != nil {
			go n.reconfigureOnConfigUpdate()
			go n.filePollConfig(*options.fileSystemConfig)
		}
	default:
		return errors.New("could not start a node. no config present")
	}

	select {
	case err := <-n.errCh:
		return err
	}
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
		Control:   reuseport.Control,
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
					abstractlogger.String("ip", nip),
					abstractlogger.Error(err),
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

func (n *Node) shutdownServerGracefully(server *http.Server) {
	<-time.After(time.Second)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*time.Duration(60))
	defer cancel()
	n.log.Debug("Gracefully shutting down old server",
		abstractlogger.String("timeout", "60s"),
	)
	_ = server.Shutdown(ctx)
	n.log.Debug("old server gracefully shut down")
}

func (n *Node) startServer(nodeConfig WunderNodeConfig) {
	var err error

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
	var allowedHosts []string

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

	hooksClient := hooks.NewClient(nodeConfig.Api.ServerUrl, n.log)

	transportFactory := apihandler.NewApiTransportFactory(nodeConfig.Api, hooksClient, n.options.enableDebugMode)

	n.log.Debug("http.Client.Transport",
		abstractlogger.Bool("enableDebugMode", n.options.enableDebugMode),
	)

	loader := engineconfigloader.New(engineconfigloader.NewDefaultFactoryResolver(transportFactory, defaultTransport, n.options.enableDebugMode, n.log))

	builderConfig := apihandler.BuilderConfig{
		InsecureCookies:            n.options.insecureCookies,
		ForceHttpsRedirects:        n.options.forceHttpsRedirects,
		EnableDebugMode:            n.options.enableDebugMode,
		EnableIntrospection:        n.options.enableIntrospection,
		GitHubAuthDemoClientID:     n.options.githubAuthDemo.ClientID,
		GitHubAuthDemoClientSecret: n.options.githubAuthDemo.ClientSecret,
		HookServerURL:              nodeConfig.Api.ServerUrl,
	}

	builder := apihandler.NewBuilder(n.pool, n.log, loader, hooksClient, builderConfig)
	internalBuilder := apihandler.NewInternalBuilder(n.pool, n.log, loader)

	publicClosers, err := builder.BuildAndMountApiHandler(n.ctx, router, nodeConfig.Api)
	if err != nil {
		n.log.Error("BuildAndMountApiHandler", abstractlogger.Error(err))
	}
	streamClosers = append(streamClosers, publicClosers...)

	internalClosers, err := internalBuilder.BuildAndMountInternalApiHandler(n.ctx, internalRouter, nodeConfig.Api)
	if err != nil {
		n.log.Error("BuildAndMountInternalApiHandler", abstractlogger.Error(err))
		err = nil
	}

	streamClosers = append(streamClosers, internalClosers...)

	allowedHosts = uniqueStrings(allowedHosts)

	defer func() {
		for _, closer := range streamClosers {
			close(closer)
		}
	}()

	router.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("WunderNode Status: OK\n"))
		_, _ = w.Write([]byte(fmt.Sprintf("BuildInfo: %+v\n", n.info)))
	}))

	n.server = &http.Server{
		Handler: router,
		ConnContext: func(ctx context.Context, c net.Conn) context.Context {
			return context.WithValue(ctx, "conn", c)
		},
		// ErrorLog: log.New(ioutil.Discard, "", log.LstdFlags),
	}

	listeners, err := n.newListeners(nodeConfig.Api.Options.Listener)
	if err != nil {
		n.errCh <- err
		return
	}

	for _, listener := range listeners {
		l := listener
		go func() {
			n.log.Info("listening on",
				abstractlogger.String("addr", l.Addr().String()),
			)
			err = n.server.Serve(l)
			if err != nil {
				if err == http.ErrServerClosed {
					n.log.Debug("listener closed",
						abstractlogger.String("addr", l.Addr().String()),
					)
					return
				}
				n.errCh <- err
			}
		}()
	}
}

func (n *Node) filterHosts(api apihandler.Api) []string {
	hosts := []string{fmt.Sprintf("%s:%d", api.Options.Listener.Host, api.Options.Listener.Port)}
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

func (n *Node) reconfigureOnConfigUpdate() {
	for {
		select {
		case config := <-n.configCh:
			n.log.Debug("Updated config -> (re-)configuring server")
			_ = n.Close()
			go n.startServer(config)
		case <-n.ctx.Done():
			return
		}
	}
}

func (n *Node) filePollConfig(filePath string) {
	go func() {
		for {
			select {
			case <-n.ctx.Done():
				return
			case _, ok := <-n.options.configFileChange:
				if !ok {
					return
				}
				n.reloadFileConfig(filePath)
			}
		}
	}()

	<-n.ctx.Done()
}

func (n *Node) reloadFileConfig(filePath string) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		n.log.Debug("reloadFileConfig ioutil.ReadFile", abstractlogger.String("filePath", filePath), abstractlogger.Error(err))
		return
	}
	if len(data) == 0 {
		return
	}
	var graphConfig wgpb.WunderGraphConfiguration
	err = json.Unmarshal(data, &graphConfig)
	if err != nil {
		n.log.Debug("reloadFileConfig json.Unmarshal", abstractlogger.String("filePath", filePath), abstractlogger.Error(err))
		return
	}

	config := CreateConfig(&graphConfig)

	n.configCh <- config
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
