package authentication

import (
	"context"
	"encoding/base64"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc"
	"github.com/buger/jsonparser"
	"github.com/cespare/xxhash"
	"github.com/dgraph-io/ristretto"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/csrf"
	"github.com/gorilla/securecookie"
	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/cachecontrol"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/httperror"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

func init() {
	gob.Register(User{})
}

type UserLoader struct {
	log             abstractlogger.Logger
	s               *securecookie.SecureCookie
	cache           *ristretto.Cache
	client          *http.Client
	userLoadConfigs []*UserLoadConfig
	hooks           Hooks
}

type UserLoadConfig struct {
	jwks             *keyfunc.JWKS
	userInfoEndpoint string
	cacheTtlSeconds  int
	issuer           string
}

func (u *UserLoader) userFromToken(token string, cfg *UserLoadConfig, user *User) error {

	fromCache, exists := u.cache.Get(token)
	if exists {
		*user = fromCache.(User)
		u.log.Debug("user loaded from cache",
			abstractlogger.String("sub", user.UserID),
		)
		return nil
	}

	var tempUser User

	if cfg.userInfoEndpoint == "" {
		tempUser = User{
			ProviderName: "token",
			ProviderID:   cfg.issuer,
			AccessToken:  tryParseJWT(token),
		}
	} else {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.userInfoEndpoint, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", token)
		res, err := u.client.Do(req)
		if err != nil {
			return err
		}
		defer res.Body.Close()
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			return err
		}
		var claims Claims
		err = json.Unmarshal(body, &claims)
		if err != nil {
			return err
		}
		tempUser = User{
			ProviderName:  "token",
			ProviderID:    cfg.issuer,
			Email:         claims.Email,
			EmailVerified: claims.EmailVerified,
			Name:          claims.Name,
			FirstName:     claims.GivenName,
			LastName:      claims.FamilyName,
			UserID:        claims.Sub,
			AvatarURL:     claims.Picture,
			Location:      claims.Locale,
			AccessToken:   tryParseJWT(token),
		}
	}
	u.hooks.handlePostAuthentication(context.Background(), tempUser)
	proceed, _, tempUser := u.hooks.handleMutatingPostAuthentication(context.Background(), tempUser)
	if !proceed {
		return fmt.Errorf("access denied")
	}
	*user = tempUser
	if cfg.cacheTtlSeconds > 0 {
		u.cache.SetWithTTL(token, *user, 1, time.Second*time.Duration(cfg.cacheTtlSeconds))
	}
	return nil
}

type User struct {
	ProviderName     string          `json:"provider,omitempty"`
	ProviderID       string          `json:"providerId,omitempty"`
	Email            string          `json:"email,omitempty"`
	EmailVerified    bool            `json:"emailVerified,omitempty"`
	Name             string          `json:"name,omitempty"`
	FirstName        string          `json:"firstName,omitempty"`
	LastName         string          `json:"lastName,omitempty"`
	NickName         string          `json:"nickName,omitempty"`
	Description      string          `json:"description,omitempty"`
	UserID           string          `json:"userId,omitempty"`
	AvatarURL        string          `json:"avatarUrl,omitempty"`
	Location         string          `json:"location,omitempty"`
	CustomClaims     json.RawMessage `json:"customClaims,omitempty"`
	CustomAttributes []string        `json:"customAttributes,omitempty"`
	Roles            []string        `json:"roles"`
	ExpiresAt        time.Time       `json:"-"`
	ETag             string          `json:"etag,omitempty"`
	FromCookie       bool            `json:"fromCookie,omitempty"`
	AccessToken      json.RawMessage `json:"accessToken,omitempty"`
	RawAccessToken   string          `json:"rawAccessToken,omitempty"`
	IdToken          json.RawMessage `json:"idToken,omitempty"`
	RawIDToken       string          `json:"rawIdToken,omitempty"`
}

// RemoveInternalFields should be used before sending the user to the client to not expose internal fields
func (u *User) RemoveInternalFields() {
	u.ETag = ""
	u.FromCookie = false
	u.AccessToken = nil
	u.RawAccessToken = ""
	u.IdToken = nil
	u.RawIDToken = ""
}

func (u *User) Save(s *securecookie.SecureCookie, w http.ResponseWriter, r *http.Request, domain string, insecureCookies bool) error {

	rawIdToken := u.RawIDToken

	// we remove these from the cookie to save space
	u.IdToken = nil
	u.AccessToken = nil
	u.RawAccessToken = ""
	u.RawIDToken = ""

	hash := xxhash.New()
	err := gob.NewEncoder(hash).Encode(*u)
	if err != nil {
		return err
	}

	u.ETag = fmt.Sprintf("W/\"%d\"", hash.Sum64())

	encoded, err := s.Encode("user", *u)
	if err != nil {
		return err
	}

	cookie := &http.Cookie{
		Name:     "user",
		Value:    encoded,
		Path:     "/",
		Domain:   removeSubdomain(sanitizeDomain(domain)),
		MaxAge:   int((time.Hour * 24 * 30).Seconds()),
		Secure:   !insecureCookies,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, cookie)

	encoded, err = s.Encode("id", rawIdToken)
	if err != nil {
		return err
	}

	cookie = &http.Cookie{
		Name:     "id",
		Value:    encoded,
		Path:     "/",
		Domain:   removeSubdomain(sanitizeDomain(domain)),
		MaxAge:   int((time.Hour * 24 * 30).Seconds()),
		Secure:   !insecureCookies,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, cookie)

	return nil
}

func (u *User) Load(loader *UserLoader, r *http.Request) error {

	authorizationHeader := r.Header.Get("Authorization")
	if loader.userLoadConfigs != nil && authorizationHeader != "" {
		if !strings.HasPrefix(authorizationHeader, "Bearer ") {
			return fmt.Errorf("invalid authorization Header")
		}
		trimmed := strings.TrimPrefix(authorizationHeader, "Bearer ")
		for i := range loader.userLoadConfigs {
			token, err := jwt.Parse(trimmed, loader.userLoadConfigs[i].jwks.Keyfunc)
			if err == nil && !token.Valid {
				continue
			}
			err = loader.userFromToken(authorizationHeader, loader.userLoadConfigs[i], u)
			if err == nil {
				return nil
			}
		}
	}

	cookie, err := r.Cookie("user")
	if err != nil {
		return err
	}
	err = loader.s.Decode("user", cookie.Value, u)
	if err == nil {
		u.FromCookie = true
	}
	cookie, err = r.Cookie("id")
	if err != nil {
		return err
	}
	err = loader.s.Decode("id", cookie.Value, &u.RawIDToken)
	u.IdToken = tryParseJWT(u.RawIDToken)
	return err
}

type Hooks struct {
	Client                     *hooks.Client
	Log                        abstractlogger.Logger
	PostAuthentication         bool
	MutatingPostAuthentication bool
	PostLogout                 bool
}

func (h *Hooks) handlePostAuthentication(ctx context.Context, user User) {
	if !h.PostAuthentication {
		return
	}
	hookData := []byte(`{}`)
	if userJson, err := json.Marshal(user); err != nil {
		h.Log.Error("Could not marshal user", abstractlogger.Error(err))
		return
	} else {
		hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
	}
	_, err := h.Client.DoAuthenticationRequest(ctx, hooks.PostAuthentication, hookData)
	if err != nil {
		h.Log.Error("PostAuthentication queries hook", abstractlogger.Error(err))
		return
	}
}

func (h *Hooks) handlePostLogout(ctx context.Context, user *User) {
	if !h.PostLogout || user == nil {
		return
	}
	hookData := []byte(`{}`)
	if userJson, err := json.Marshal(user); err != nil {
		h.Log.Error("Could not marshal user", abstractlogger.Error(err))
		return
	} else {
		hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
	}
	_, err := h.Client.DoAuthenticationRequest(ctx, hooks.PostLogout, hookData)
	if err != nil {
		h.Log.Error("PostLogout queries hook", abstractlogger.Error(err))
	}
}

type MutatingPostAuthenticationResponse struct {
	User    User   `json:"user"`
	Message string `json:"message"`
	Status  string `json:"status"`
}

func (h *Hooks) handleMutatingPostAuthentication(ctx context.Context, user User) (proceed bool, message string, updatedUser User) {
	if !h.MutatingPostAuthentication {
		return true, "", user
	}
	hookData := []byte(`{}`)
	if userJson, err := json.Marshal(user); err != nil {
		return false, "", User{}
	} else {
		hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
	}
	out, err := h.Client.DoAuthenticationRequest(ctx, hooks.MutatingPostAuthentication, hookData)
	if err != nil {
		h.Log.Error("MutatingPostAuthentication queries hook", abstractlogger.Error(err))
		return
	}
	if out.Error != "" {
		return false, "", User{}
	}
	var res MutatingPostAuthenticationResponse
	err = json.Unmarshal(out.Response, &res)
	if err != nil {
		return false, "", User{}
	}
	if res.Status == "ok" {
		return true, "", res.User
	}
	return false, res.Message, User{}
}

func bearerTokenToJSON(token string) ([]byte, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	return payload, nil
}

func tryParseJWT(token string) []byte {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil
	}
	return payload
}

func ValidateRedirectURIQueryParameter(matchString, matchRegex []string) func(handler http.Handler) http.Handler {
	validator := NewRedirectValidator(matchString, matchRegex)
	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, authorized := validator.GetValidatedRedirectURI(r)
			if authorized {
				handler.ServeHTTP(w, r)
				return
			}
			httperror.Error(w, "invalid redirect uri", http.StatusBadRequest)
		})
	}
}

type RedirectURIValidator struct {
	stringMatchers []string
	regexMatchers  []*regexp.Regexp
}

func NewRedirectValidator(matchString, matchRegex []string) *RedirectURIValidator {
	regexMatchers := make([]*regexp.Regexp, 0, len(matchRegex))

	for _, uri := range matchRegex {
		matcher, err := regexp.Compile(uri)
		if err == nil {
			regexMatchers = append(regexMatchers, matcher)
		}
	}

	stringMatchers := make([]string, 0, len(matchString)*2)
	for _, str := range matchString {
		stringMatchers = append(stringMatchers, str)
		if strings.HasSuffix(str, "/") {
			stringMatchers = append(stringMatchers, strings.TrimSuffix(str, "/"))
		} else {
			stringMatchers = append(stringMatchers, str+"/")
		}
	}

	return &RedirectURIValidator{
		stringMatchers: stringMatchers,
		regexMatchers:  regexMatchers,
	}
}

func (v *RedirectURIValidator) GetValidatedRedirectURI(r *http.Request) (redirectURI string, authorized bool) {
	redirectURI = r.URL.Query().Get("redirect_uri")
	if redirectURI == "" {
		redirectURICookie, err := r.Cookie("success_redirect_uri")
		if err != nil || redirectURICookie == nil {
			return "", false
		}
		redirectURI = redirectURICookie.Value
	}
	if redirectURI == "" {
		return "", false
	}
	for i := range v.stringMatchers {
		if v.stringMatchers[i] == redirectURI {
			return redirectURI, true
		}
	}
	for _, matcher := range v.regexMatchers {
		if matcher.MatchString(redirectURI) {
			return redirectURI, true
		}
	}
	return redirectURI, false
}

func RedirectAlreadyAuthenticatedUsers(matchString, matchRegex []string) func(handler http.Handler) http.Handler {
	validator := NewRedirectValidator(matchString, matchRegex)
	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if user := UserFromContext(r.Context()); user != nil {
				redirectURI, authorized := validator.GetValidatedRedirectURI(r)
				if authorized {
					http.Redirect(w, r, redirectURI, http.StatusTemporaryRedirect)
					return
				}
			}
			handler.ServeHTTP(w, r)
		})
	}
}

type RBACEnforcer struct {
	hasRules bool

	requireMatchAll []string
	requireMatchAny []string
	denyMatchAll    []string
	denyMatchAny    []string

	hasRequireMatchAll bool
	hasRequireMatchAny bool
	hasDenyMatchAll    bool
	hasDenyMatchAny    bool
}

func NewRBACEnforcer(operation *wgpb.Operation) *RBACEnforcer {
	if len(operation.AuthorizationConfig.RoleConfig.RequireMatchAll) == 0 &&
		len(operation.AuthorizationConfig.RoleConfig.RequireMatchAny) == 0 &&
		len(operation.AuthorizationConfig.RoleConfig.DenyMatchAll) == 0 &&
		len(operation.AuthorizationConfig.RoleConfig.DenyMatchAny) == 0 {
		return &RBACEnforcer{
			hasRules: false,
		}
	}
	return &RBACEnforcer{
		hasRules:           true,
		denyMatchAll:       operation.AuthorizationConfig.RoleConfig.DenyMatchAll,
		denyMatchAny:       operation.AuthorizationConfig.RoleConfig.DenyMatchAny,
		requireMatchAll:    operation.AuthorizationConfig.RoleConfig.RequireMatchAll,
		requireMatchAny:    operation.AuthorizationConfig.RoleConfig.RequireMatchAny,
		hasDenyMatchAll:    len(operation.AuthorizationConfig.RoleConfig.DenyMatchAll) != 0,
		hasDenyMatchAny:    len(operation.AuthorizationConfig.RoleConfig.DenyMatchAny) != 0,
		hasRequireMatchAll: len(operation.AuthorizationConfig.RoleConfig.RequireMatchAll) != 0,
		hasRequireMatchAny: len(operation.AuthorizationConfig.RoleConfig.RequireMatchAny) != 0,
	}
}

func (e *RBACEnforcer) Enforce(r *http.Request) (proceed bool) {
	if !e.hasRules {
		return true
	}
	user := UserFromContext(r.Context())
	if user == nil {
		return false
	}
	if ok := e.enforceRequireMatchAll(user); !ok {
		return false
	}
	if ok := e.enforceRequireMatchAny(user); !ok {
		return false
	}
	if ok := e.enforceDenyMatchAll(user); !ok {
		return false
	}
	if ok := e.enforceDenyMatchAny(user); !ok {
		return false
	}
	return true
}

func (e *RBACEnforcer) enforceRequireMatchAll(user *User) bool {
	if !e.hasRequireMatchAll {
		return true
	}
	for _, match := range e.requireMatchAll {
		if contains := e.containsOne(user.Roles, match); !contains {
			return false
		}
	}
	return true
}

func (e *RBACEnforcer) enforceRequireMatchAny(user *User) bool {
	if !e.hasRequireMatchAny {
		return true
	}
	for _, match := range e.requireMatchAny {
		if contains := e.containsOne(user.Roles, match); contains {
			return true
		}
	}
	return false
}

func (e *RBACEnforcer) enforceDenyMatchAll(user *User) bool {
	if !e.hasDenyMatchAll {
		return true
	}
	for _, match := range e.denyMatchAll {
		if contains := e.containsOne(user.Roles, match); !contains {
			return true
		}
	}
	return false
}

func (e *RBACEnforcer) enforceDenyMatchAny(user *User) bool {
	if !e.hasDenyMatchAny {
		return true
	}
	for _, match := range e.denyMatchAny {
		if contains := e.containsOne(user.Roles, match); contains {
			return false
		}
	}
	return true
}

func (e *RBACEnforcer) containsOne(slice []string, one string) bool {
	for i := range slice {
		if slice[i] == one {
			return true
		}
	}
	return false
}

type LoadUserConfig struct {
	Log           abstractlogger.Logger
	Cookie        *securecookie.SecureCookie
	JwksProviders []*wgpb.JwksAuthProvider
	Hooks         Hooks
}

func NewLoadUserMw(config LoadUserConfig) func(handler http.Handler) http.Handler {

	var (
		jwkConfigs []*UserLoadConfig
	)

	if config.JwksProviders != nil {
		for _, provider := range config.JwksProviders {
			userInfoEndpoint := loadvariable.String(provider.UserInfoEndpoint)
			userInfoURL, err := url.Parse(userInfoEndpoint)
			if err != nil {
				config.Log.Error("jwks userInfo endpoint invalid URL",
					abstractlogger.Error(err),
					abstractlogger.String("URL", userInfoEndpoint),
				)
				continue
			}
			if jwksURL := loadvariable.String(provider.JwksUrl); jwksURL != "" {
				ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
				jwks, err := keyfunc.Get(jwksURL, keyfunc.Options{
					Ctx: ctx,
				})
				cancel()
				if err != nil {
					config.Log.Error("loading jwks from URL failed",
						abstractlogger.Error(err),
						abstractlogger.String("URL", jwksURL),
					)
					continue
				}
				jwkConfigs = append(jwkConfigs, &UserLoadConfig{
					jwks:             jwks,
					userInfoEndpoint: userInfoEndpoint,
					cacheTtlSeconds:  int(provider.UserInfoCacheTtlSeconds),
					issuer:           userInfoURL.Host,
				})
				continue
			}
			if js := loadvariable.String(provider.JwksJson); js != "" {
				jwks, err := keyfunc.NewJSON(json.RawMessage(js))
				if err != nil {
					config.Log.Error("loading jwks from JSON failed",
						abstractlogger.Error(err),
						abstractlogger.String("JSON", js),
					)
					continue
				}
				jwkConfigs = append(jwkConfigs, &UserLoadConfig{
					jwks:             jwks,
					userInfoEndpoint: userInfoEndpoint,
					cacheTtlSeconds:  int(provider.UserInfoCacheTtlSeconds),
					issuer:           userInfoURL.Host,
				})
				continue
			}
			jwkConfigs = append(jwkConfigs, &UserLoadConfig{
				jwks:             keyfunc.NewGiven(map[string]keyfunc.GivenKey{}),
				userInfoEndpoint: userInfoEndpoint,
				cacheTtlSeconds:  int(provider.UserInfoCacheTtlSeconds),
				issuer:           userInfoURL.Host,
			})
		}
	}

	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1024 * 1024 / 10,
		MaxCost:     1024 * 1024,
		BufferItems: 64,
	})

	if err != nil {
		config.Log.Error("unable to instantiate user loader cache",
			abstractlogger.Error(err),
		)
	}

	loader := &UserLoader{
		log:             config.Log,
		userLoadConfigs: jwkConfigs,
		s:               config.Cookie,
		cache:           cache,
		client: &http.Client{
			Timeout: time.Second * 10,
		},
		hooks: config.Hooks,
	}

	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var user User
			err := user.Load(loader, r)
			if err == nil {
				r = r.WithContext(context.WithValue(r.Context(), "user", &user))
			}
			handler.ServeHTTP(w, r)
		})
	}
}

func UserFromContext(ctx context.Context) *User {
	user := ctx.Value("user")
	if actual, ok := user.(*User); ok {
		return actual
	}
	return nil
}

type TokenUserHandler struct{}

func (_ TokenUserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	if user == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	user.RemoveInternalFields()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(user)
}

type CookieUserHandler struct {
	HasRevalidateHook bool
	MWClient          *hooks.Client
	Log               abstractlogger.Logger
	Host              string
	InsecureCookies   bool
	Cookie            *securecookie.SecureCookie
}

func (u *CookieUserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	if user == nil {
		http.NotFound(w, r)
		return
	}
	if u.HasRevalidateHook && r.URL.Query().Get("revalidate") == "true" {
		hookData := []byte(`{}`)
		if userJson, err := json.Marshal(user); err != nil {
			u.Log.Error("Could not marshal user", abstractlogger.Error(err))
			http.NotFound(w, r)
			return
		} else {
			hookData, _ = jsonparser.Set(hookData, userJson, "user")
		}
		if user.AccessToken != nil {
			hookData, _ = jsonparser.Set(hookData, user.AccessToken, "access_token")
		}
		if user.IdToken != nil {
			hookData, _ = jsonparser.Set(hookData, user.IdToken, "id_token")
		}
		out, err := u.MWClient.DoAuthenticationRequest(r.Context(), hooks.RevalidateAuthentication, hookData)
		if err != nil {
			u.Log.Error("RevalidateAuthentication request failed", abstractlogger.Error(err))
			http.NotFound(w, r)
			return
		}
		if out.Error != "" {
			u.Log.Error("RevalidateAuthentication returned an error", abstractlogger.Error(err))
			http.NotFound(w, r)
			return
		}
		var res MutatingPostAuthenticationResponse
		err = json.Unmarshal(out.Response, &res)
		if res.Status != "ok" {
			u.Log.Error("RevalidateAuthentication status is not ok", abstractlogger.Error(err))
			http.NotFound(w, r)
			return
		}
		res.User.AccessToken = user.AccessToken
		res.User.IdToken = user.IdToken
		user = &res.User
		err = user.Save(u.Cookie, w, r, u.Host, u.InsecureCookies)
		if err != nil {
			u.Log.Error("RevalidateAuthentication could not save cookie", abstractlogger.Error(err))
			http.NotFound(w, r)
			return
		}
	}

	if r.Header.Get("If-None-Match") == user.ETag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header()["ETag"] = []string{user.ETag}
	cachecontrol.EnableCache(w, false, 0, 60)

	user.RemoveInternalFields()
	if r.Header.Get("Accept") != "application/json" {
		encoder := json.NewEncoder(w)
		encoder.SetIndent("", "  ")
		_ = encoder.Encode(user)
		return
	}
	_ = json.NewEncoder(w).Encode(user)
}

type CSRFTokenHandler struct{}

func (_ *CSRFTokenHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := csrf.Token(r)
	_, _ = w.Write([]byte(token))
}

type UserLogoutHandler struct {
	InsecureCookies                  bool
	OpenIDConnectIssuersToLogoutURLs map[string]string
	Hooks                            Hooks
}

func (u *UserLogoutHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	resetUserCookies(w, r, !u.InsecureCookies)
	user := UserFromContext(r.Context())
	if user == nil {
		return
	}
	u.Hooks.handlePostLogout(r.Context(), user)
	logoutOpenIDConnectProvider := r.URL.Query().Has("logout_openid_connect_provider")
	if !logoutOpenIDConnectProvider {
		return
	}
	if user.ProviderName != "oidc" {
		return
	}
	if user.IdToken == nil {
		return
	}
	issuer, err := jsonparser.GetString(user.IdToken, "iss")
	if err != nil || issuer == "" {
		return
	}
	logoutURL, ok := u.OpenIDConnectIssuersToLogoutURLs[issuer]
	if !ok {
		return
	}
	req, err := http.NewRequestWithContext(r.Context(), "GET", logoutURL, nil)
	if err != nil {
		return
	}
	q := req.URL.Query()
	q.Set("id_token_hint", user.RawIDToken)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{
		Timeout: time.Second * 10,
	}
	_, _ = client.Do(req)
	// we can safely ignore the outcome
}

type CSRFErrorHandler struct {
	InsecureCookies bool
}

func (u *CSRFErrorHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	resetUserCookies(w, r, !u.InsecureCookies)
	httperror.Error(w, "forbidden", http.StatusForbidden)
}

// sanitizeDomain cleans up the host so that it can work on localhost
func sanitizeDomain(domain string) string {
	if !strings.Contains(domain, ":") {
		return domain
	}
	i := strings.Index(domain, ":")
	return domain[:i]
}

func removeSubdomain(domain string) string {
	parts := strings.Split(domain, ".")
	if len(parts) < 3 {
		return domain
	}
	return strings.Join(parts[1:], ".")
}

type CSRFConfig struct {
	Path            string
	InsecureCookies bool
	Secret          []byte
}

func NewCSRFMw(config CSRFConfig) func(handler http.Handler) http.Handler {
	return func(unprotected http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if user := UserFromContext(r.Context()); user != nil && user.FromCookie {
				domain := removeSubdomain(sanitizeDomain(r.Host))
				csrfMiddleware := csrf.Protect(config.Secret,
					csrf.Path("/"),
					csrf.Domain(domain),
					csrf.CookieName("csrf"),
					csrf.RequestHeader("X-CSRF-Token"),
					csrf.HttpOnly(true),
					csrf.Secure(!config.InsecureCookies),
					csrf.SameSite(csrf.SameSiteStrictMode),
					csrf.ErrorHandler(&CSRFErrorHandler{
						InsecureCookies: config.InsecureCookies,
					}),
				)
				csrfMiddleware(unprotected).ServeHTTP(w, r)
				return
			}
			unprotected.ServeHTTP(w, r)
		})
	}
}

func RequiresAuthentication(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := UserFromContext(r.Context())
		if user == nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		handler.ServeHTTP(w, r)
	})
}

func resetUserCookies(w http.ResponseWriter, r *http.Request, secure bool) {
	for _, name := range []string{"user", "id"} {
		userCookie := &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			Domain:   removeSubdomain(sanitizeDomain(r.Host)),
			MaxAge:   -1,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
			Secure:   secure,
		}
		http.SetCookie(w, userCookie)
	}
}
