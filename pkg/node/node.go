package node

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/pires/go-proxyproto"
	"github.com/valyala/fasthttp"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/middlewareclient"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"
	"golang.org/x/net/idna"
	"golang.org/x/time/rate"

	"github.com/libp2p/go-reuseport"

	"github.com/gorilla/mux"
)

func New(ctx context.Context, info BuildInfo, cfg *wundernodeconfig.Config, log abstractlogger.Logger) *Node {
	return &Node{
		info:     info,
		cfg:      cfg,
		ctx:      ctx,
		errCh:    make(chan error),
		configCh: make(chan wgpb.WunderNodeConfig),
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

	cfg *wundernodeconfig.Config

	stopped  bool
	errCh    chan error
	configCh chan wgpb.WunderNodeConfig

	server *http.Server

	pool *pool.Pool
	log  abstractlogger.Logger

	apiClient *fasthttp.Client

	options options
}

type options struct {
	staticConfig        *wgpb.WunderNodeConfig
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
	hooksSecret             []byte
	githubAuthDemo          GitHubAuthDemo
}

type Option func(options *options)

func WithStaticWunderNodeConfig(config wgpb.WunderNodeConfig) Option {
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

func WithHooksSecret(secret []byte) Option {
	return func(options *options) {
		options.hooksSecret = secret
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

	if options.staticConfig != nil {
		n.log.Info("Api config: static")
		go n.startServer(*options.staticConfig)
	} else if options.fileSystemConfig != nil {
		n.log.Info("Api config: file polling",
			abstractlogger.String("config_file_name", *options.fileSystemConfig),
		)
		if options.configFileChange != nil {
			go n.reconfigureOnConfigUpdate()
			go n.filePollConfig(*options.fileSystemConfig)
		}
	} else {
		n.log.Info("Api config: network polling")
		go n.reconfigureOnConfigUpdate()
		go n.netPollConfig()
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

func (n *Node) newListeners() ([]net.Listener, error) {
	cfg := net.ListenConfig{
		Control:   reuseport.Control,
		KeepAlive: 90 * time.Second,
	}

	host, port, _ := net.SplitHostPort(n.cfg.Server.ListenAddr)

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
			listener, err := cfg.Listen(context.Background(), "tcp6", fmt.Sprintf("[%s]:%s", nip, port))
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
			listener, err := cfg.Listen(context.Background(), "tcp4", fmt.Sprintf("%s:%s", nip, port))
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
		listener, err := cfg.Listen(context.Background(), "tcp", n.cfg.Server.ListenAddr)
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

func (n *Node) startServer(nodeConfig wgpb.WunderNodeConfig) {

	var (
		err error
	)

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

	for _, api := range nodeConfig.Apis {

		dialer := &net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 90 * time.Second,
		}

		httpTransport := &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return dialer.DialContext(ctx, network, addr)
			},
			ForceAttemptHTTP2:   true,
			MaxIdleConns:        1024,
			IdleConnTimeout:     90 * time.Second,
			TLSHandshakeTimeout: 10 * time.Second,
		}

		hooksClient := middlewareclient.NewMiddlewareClient("http://127.0.0.1:9992")

		transport := apihandler.NewApiTransport(httpTransport, api, hooksClient, n.options.enableDebugMode)

		client := &http.Client{
			Timeout:   time.Second * 10,
			Transport: transport,
		}

		n.log.Debug("http.Client.Transport",
			abstractlogger.Bool("enableDebugMode", n.options.enableDebugMode),
		)

		loader := engineconfigloader.New(engineconfigloader.NewDefaultFactoryResolver(client, n.options.enableDebugMode, n.log))

		builderConfig := apihandler.BuilderConfig{
			InsecureCookies:            n.options.insecureCookies,
			ForceHttpsRedirects:        n.options.forceHttpsRedirects,
			EnableDebugMode:            n.options.enableDebugMode,
			EnableIntrospection:        n.options.enableIntrospection,
			GitHubAuthDemoClientID:     n.options.githubAuthDemo.ClientID,
			GitHubAuthDemoClientSecret: n.options.githubAuthDemo.ClientSecret,
		}
		builder := apihandler.NewBuilder(n.pool, n.log, loader, hooksClient, builderConfig)
		internalBuilder := apihandler.NewInternalBuilder(n.pool, n.log, loader)

		publicClosers, err := builder.BuildAndMountApiHandler(n.ctx, router, api)
		if err != nil {
			n.log.Error("BuildAndMountApiHandler", abstractlogger.Error(err))
		}
		streamClosers = append(streamClosers, publicClosers...)

		internalClosers, err := internalBuilder.BuildAndMountInternalApiHandler(n.ctx, internalRouter, api, n.options.hooksSecret)
		if err != nil {
			n.log.Error("BuildAndMountInternalApiHandler", abstractlogger.Error(err))
			err = nil
		}

		streamClosers = append(streamClosers, internalClosers...)
	}

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

	listeners, err := n.newListeners()
	if err != nil {
		n.errCh <- err
		return
	}

	if n.cfg.Server.ListenTLS {
		manager := autocert.Manager{
			Prompt: autocert.AcceptTOS,
			//Cache:  certCache,
			HostPolicy: func(ctx context.Context, host string) error {
				for _, allowedHost := range allowedHosts {
					if allowedHost == host {
						n.log.Debug("Node.autocert.HostPolicy.allow",
							abstractlogger.String("host", host),
						)
						return nil
					}
				}
				n.log.Debug("Node.autocert.HostPolicy.disallow",
					abstractlogger.String("host", host),
				)
				return fmt.Errorf("autocert hostpolicy disallows host: %s", host)
			},
		}
		n.server.TLSConfig = &tls.Config{
			GetCertificate: func(info *tls.ClientHelloInfo) (*tls.Certificate, error) {
				n.log.Debug("Node.tls.GetCertificate",
					abstractlogger.String("ServerName", info.ServerName),
				)
				name, err := idna.Lookup.ToASCII(info.ServerName)
				if err != nil {
					n.log.Error("Node.tls.GetCertificate.idna.Lookup",
						abstractlogger.Error(err),
					)
					return nil, err
				}
				n.log.Debug("Node.tls.GetCertificate",
					abstractlogger.String("serverName", name),
				)
				return manager.GetCertificate(info)
			},
			NextProtos: []string{acme.ALPNProto},
		}
		for _, listener := range listeners {
			l := listener
			go func() {
				n.log.Info("listening on",
					abstractlogger.String("addr", l.Addr().String()),
				)
				err = n.server.ServeTLS(l, "", "")
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
	} else {
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
}

func (n *Node) filterHosts(api *wgpb.Api) []string {
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

func (n *Node) netPollConfig() {
	buf := &bytes.Buffer{}
	client := http.Client{
		Timeout: time.Second * time.Duration(10),
	}
	var (
		etag string
	)
	for {
		buf.Reset()
		req, err := http.NewRequest(http.MethodGet, n.cfg.LoadConfig.URL+"/wundernode/config", nil)
		if err != nil {
			n.errCh <- err
			return
		}
		req.Header.Set("Authorization", "Bearer "+n.cfg.LoadConfig.BearerToken)
		if etag != "" {
			req.Header.Set("If-None-Match", etag)
		}
		res, err := client.Do(req)
		if err != nil {
			n.log.Error("netPollConfig client.Do", abstractlogger.Error(err))
			time.Sleep(time.Second * time.Duration(10))
			continue
		}
		switch res.StatusCode {
		case http.StatusOK:
			etag = res.Header.Get("ETag")
			_, err = buf.ReadFrom(res.Body)
			if err != nil {
				n.log.Error("netPollConfig res.Body read", abstractlogger.Error(err))
				time.Sleep(time.Second * time.Duration(10))
				continue
			}
			var config wgpb.WunderNodeConfig
			err = json.Unmarshal(buf.Bytes(), &config)
			if err != nil {
				n.log.Error("netPollConfig json.Unmarshal", abstractlogger.Error(err))
				time.Sleep(time.Second * time.Duration(10))
				etag = ""
				continue
			}
			select {
			case n.configCh <- config:
			default:
			}
		case http.StatusNotModified:
			n.log.Debug("netPollConfig config not modified")
			break
		default:
			n.log.Debug("netPollConfig unexpected status",
				abstractlogger.Int("status_code", res.StatusCode),
				abstractlogger.String("status_message", res.Status),
			)
		}
		n.log.Debug("netPollConfig wait 10s")
		select {
		case <-time.After(time.Second * time.Duration(10)):
			continue
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

	config := wgpb.WunderNodeConfig{
		Apis: []*wgpb.Api{
			{
				PrimaryHost:           n.cfg.Server.ListenAddr,
				Hosts:                 loadvariable.Strings(graphConfig.Api.AllowedHostNames),
				PathPrefix:            path.Join(graphConfig.ApiName, graphConfig.DeploymentName),
				EngineConfiguration:   graphConfig.Api.EngineConfiguration,
				EnableSingleFlight:    true,
				EnableGraphqlEndpoint: graphConfig.DangerouslyEnableGraphQLEndpoint,
				Operations:            graphConfig.Api.Operations,
				CorsConfiguration:     graphConfig.Api.CorsConfiguration,
				S3UploadConfiguration: graphConfig.Api.S3UploadConfiguration,
				CacheConfig: &wgpb.ApiCacheConfig{
					Kind: wgpb.ApiCacheKind_IN_MEMORY_CACHE,
					InMemoryConfig: &wgpb.InMemoryCacheConfig{
						MaxSize: 1e9,
					},
				},
				AuthenticationConfig: graphConfig.Api.AuthenticationConfig,
			},
		},
		Server: &wgpb.Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             10,
		},
		Logging: &wgpb.Logging{
			Level: wgpb.LogLevel_DEBUG,
		},
	}
	n.configCh <- config
}

func (n *Node) sendMetrics(data []byte, try int) {
	req, res := fasthttp.AcquireRequest(), fasthttp.AcquireResponse()
	defer func() {
		fasthttp.ReleaseRequest(req)
		fasthttp.ReleaseResponse(res)
	}()

	req.SetRequestURI("http://localhost:8080/wundernode/metrics")
	req.Header.SetMethod(http.MethodPost)
	req.Header.Set("Content-Type", "application/protobuf")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", n.cfg.LoadConfig.BearerToken))
	req.SetBody(data)

	n.log.Debug("sending metrics")

	err := n.apiClient.DoTimeout(req, res, time.Second*5)
	if res.StatusCode() != http.StatusOK {
		n.log.Debug("sendMetrics status", abstractlogger.Int("code", res.StatusCode()))
	}
	if err != nil {
		if try < 4 {
			n.log.Error("sendMetrics retrying", abstractlogger.Error(err))
			<-time.After(time.Second * 5 * time.Duration(try))
			n.sendMetrics(data, try+1)
			return
		}
		n.log.Error("sendMetrics failed", abstractlogger.Error(err))
		return
	}
	n.log.Debug("metrics sent")
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
