package auth

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/fatih/color"
	"github.com/golang-jwt/jwt/v4"
	"github.com/skratchdot/open-golang/open"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

var (
	red    = color.New(color.FgHiRed)
	green  = color.New(color.FgHiGreen)
	blue   = color.New(color.FgHiBlue)
	yellow = color.New(color.FgHiYellow)
	cyan   = color.New(color.FgHiCyan)
	white  = color.New(color.FgHiWhite)
)

type JWTRefreshResponse struct {
	ExpiresIn        int    `json:"expires_in,omitempty"`
	RefreshExpiresIn int    `json:"refresh_expires_in,omitempty"`
	RefreshToken     string `json:"refresh_token,omitempty"`
	AccessToken      string `json:"access_token,omitempty"`
	TokenType        string `json:"token_type,omitempty"`
	SessionState     string `json:"session_state,omitempty"`
	Scope            string `json:"scope,omitempty"`
	NotBeforePolicy  string `json:"not-before-policy,omitempty"`
}

type DeviceResponse struct {
	DeviceCode              string `json:"device_code,omitempty"`
	ExpiresIn               int    `json:"expires_in,omitempty"`
	Interval                int    `json:"interval,omitempty"`
	UserCode                string `json:"user_code,omitempty"`
	VerificationUri         string `json:"verification_uri,omitempty"`
	VerificationUriComplete string `json:"verification_uri_complete,omitempty"`
}

type AccessToken struct {
	AccessToken  string `json:"access_token,omitempty"`
	ExpiresIn    int    `json:"expires_in,omitempty"`
	IdToken      string `json:"id_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
	TokenType    string `json:"token_type,omitempty"`
	UserId       string `json:"userId,omitempty"`
}

type Authenticator struct {
	authBaseUrl string
	clientID    string
	log         *zap.Logger
}

func New(logger *zap.Logger, authBaseUrl string, clientID string) *Authenticator {
	return &Authenticator{
		authBaseUrl: authBaseUrl,
		clientID:    clientID,
		log:         logger,
	}
}

func (a *Authenticator) Login() string {
	defer func() {
		if err := config.SaveConfig(viper.AllSettings()); err != nil {
			a.log.Error("error saving config file", zap.Error(err))
		}
	}()

	// auth is only available after successful authentication
	if viper.InConfig("auth") {
		// check if the access_token can be reused
		if a.tokenIsValid() {
			return viper.GetString("auth.access_token")
		}

		// check if we can issue a new access_token with the current refresh_token
		token, err := a.refreshJWT(viper.GetString("auth.refresh_token"))
		if err != nil {
			a.log.Error("could not refresh jwt", zap.Error(err))
			// important: as fallback we always initiate the full device grant flow
		}
		if token != "" {
			a.log.Debug("jwt was refreshed with refresh token")
			return token
		}
		a.log.Debug("refresh token is no longer valid")
	}

	a.log.Debug("start device grant flow")

	deviceResp, err := a.startDeviceGrantFlow()
	if err != nil {
		a.log.Error("could not start device grant flow", zap.Error(err))
		log.Fatal(err)
	}

	err = a.informUserAndOpenBrowser(deviceResp.UserCode, deviceResp.VerificationUri, deviceResp.VerificationUriComplete)
	if err != nil {
		a.log.Error("could not open browser", zap.Error(err))
		log.Fatal(err)
	}

	a.log.Debug("browser opened for user to enter code")

	token, err := a.startPolling(deviceResp.DeviceCode, deviceResp.Interval)
	if err != nil {
		a.log.Error("could not start polling", zap.Error(err))
		log.Fatal(err)
	}

	wgClient := v2wundergraphapi.New(token.AccessToken, viper.GetString("API_URL"), &http.Client{
		Timeout: time.Second * 10,
	}, a.log)

	err = wgClient.RegisterCliUserWithAccessToken()
	if err != nil {
		a.log.Error("could not register cli user", zap.Error(err))
		log.Fatal(err)
	}

	viper.Set("auth", token)

	a.log.Debug("device was successfully authenticated")

	return token.AccessToken
}

func (a *Authenticator) tokenIsValid() bool {
	accessToken := viper.GetString("auth.access_token")
	if accessToken == "" {
		return false
	}
	parser := jwt.NewParser()

	claims := jwt.MapClaims{}
	_, _, err := parser.ParseUnverified(accessToken, claims)
	if err != nil {
		return false
	}
	return claims.VerifyExpiresAt(time.Now().Unix(), true)
}

func (a *Authenticator) LoadRefreshAccessToken() string {
	if viper.InConfig("auth") {
		// check if the access_token can be reused
		if a.tokenIsValid() {
			return viper.GetString("auth.access_token")
		}
		// check if we can issue a new access_token with the current refresh_token
		token, err := a.refreshJWT(viper.GetString("auth.refresh_token"))
		if err != nil {
			a.log.Error("could not refresh jwt", zap.Error(err))
		}
		if token != "" {
			a.log.Debug("jwt was refreshed with refresh token")
			return token
		}
		a.log.Debug("refresh token is no longer valid")
	}
	return ""
}

func (a *Authenticator) Logout() {
	configMap := viper.AllSettings()

	// currently, it's not possible to unset a key with the api
	// workaround: https://github.com/spf13/viper/issues/632
	delete(configMap, "auth")

	if err := config.SaveConfig(configMap); err != nil {
		a.log.Error("error saving config file", zap.Error(err))
	}
}

func (a *Authenticator) refreshJWT(refreshToken string) (string, error) {
	var result = &JWTRefreshResponse{}

	client := http.Client{}
	client.Timeout = time.Second * 10

	resp, err := http.PostForm(a.authBaseUrl+"/protocol/openid-connect/token", url.Values{
		"client_id":     {a.clientID},
		"refresh_token": {refreshToken},
		"grant_type":    {"refresh_token"},
	})

	if err != nil {
		a.log.Error("post refresh token form failed", zap.Error(err))
		return "", err
	}

	if resp.StatusCode != 200 {
		a.log.Error("post refresh token form failed", zap.Int("statusCode", resp.StatusCode))
		return "", fmt.Errorf("could not request for a new access token with refresh token, statusCode: %d", resp.StatusCode)
	}

	defer resp.Body.Close()
	json.NewDecoder(resp.Body).Decode(result)

	viper.Set("auth.access_token", result.AccessToken)
	viper.Set("auth.refresh_token", result.RefreshToken)
	viper.Set("auth.expires_in", result.ExpiresIn)
	viper.Set("auth.scope", result.Scope)
	viper.Set("auth.token_type", result.TokenType)

	return result.AccessToken, nil
}

func (a *Authenticator) startDeviceGrantFlow() (*DeviceResponse, error) {
	var result = &DeviceResponse{}

	resp, err := http.PostForm(a.authBaseUrl+"/protocol/openid-connect/auth/device", url.Values{
		"client_id": {a.clientID},
	})

	if err != nil {
		a.log.Error("post device authorize form failed", zap.Error(err))
		return result, err
	}

	if resp.StatusCode != 200 {
		a.log.Error("post device authorize form failed", zap.Int("statusCode", resp.StatusCode))
		return nil, fmt.Errorf("could not request for device code, statusCode: %d", resp.StatusCode)
	}

	defer resp.Body.Close()
	json.NewDecoder(resp.Body).Decode(result)

	return result, nil
}

func (a *Authenticator) informUserAndOpenBrowser(userCode, verificationUri, verificationUriComplete string) error {

	_, _ = blue.Printf("Code: %s\n", white.Sprint(userCode))
	_, _ = blue.Printf("If your browser doesn't automatically open, use this URL and enter the Code to verify the login: %s\n", white.Sprint(verificationUri))
	_, _ = cyan.Printf("Opening browser for login...\n")

	return open.Run(verificationUriComplete)
}

func (a *Authenticator) startPolling(deviceCode string, retryInterval int) (*AccessToken, error) {
	var result = &AccessToken{}

	a.log.Debug("starting polling",
		zap.String("deviceCode", deviceCode),
		zap.Int("retryInterval", retryInterval),
	)

	for {
		resp, err := http.PostForm(fmt.Sprintf("%s/protocol/openid-connect/token", a.authBaseUrl), url.Values{
			"device_code": {deviceCode},
			"grant_type":  {"urn:ietf:params:oauth:grant-type:device_code"},
			"client_id":   {a.clientID},
		})

		if err != nil {
			a.log.Error("post token form failed", zap.Error(err))
			return result, err
		}

		a.log.Debug("polling",
			zap.Int("statusCode", resp.StatusCode),
		)

		// 400 status code (StatusBadRequest) is our sign that the user
		// hasn't completed their device login yet, sleep and then continue.
		if resp.StatusCode == http.StatusBadRequest {

			// Sleep for the retry interval and print a dot for each second.
			for i := 0; i < retryInterval; i++ {
				_, _ = yellow.Printf(".")
				time.Sleep(time.Second)
			}

			continue
		} else if resp.StatusCode != http.StatusOK {
			a.log.Error("could not poll token", zap.Int("statusCode", resp.StatusCode))
			return nil, fmt.Errorf("could not poll token, statusCode: %d", resp.StatusCode)
		}

		fmt.Printf("\n")
		err = json.NewDecoder(resp.Body).Decode(result)
		_ = resp.Body.Close()
		if err != nil {
			a.log.Error("could not decode response", zap.Error(err))
			continue
		}

		a.log.Debug("polling finished",
			zap.String("accessToken", result.AccessToken),
			zap.String("refreshToken", result.RefreshToken),
			zap.Int("expiresIn", result.ExpiresIn),
			zap.String("scope", result.Scope),
			zap.String("tokenType", result.TokenType),
			zap.String("idToken", result.IdToken),
		)

		return result, nil
	}
}
