package hooks

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/buger/jsonparser"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/pool"
)

type AuthenticationDeniedError string

func (e AuthenticationDeniedError) Error() string { return fmt.Sprintf("access denied: %s", string(e)) }

type AuthenticationConfig struct {
	Client                     *Client
	Log                        *zap.Logger
	PostAuthentication         bool
	MutatingPostAuthentication bool
	PostLogout                 bool
	Revalidate                 bool
}

type AuthenticationHooks struct {
	config AuthenticationConfig
}

func NewAuthenticationHooks(config AuthenticationConfig) *AuthenticationHooks {
	return &AuthenticationHooks{
		config: config,
	}
}

func (h *AuthenticationHooks) PostAuthentication(ctx context.Context, user *authentication.User) error {
	log := h.config.Log.With(zap.String("hook", "postAuthentication"))
	if !h.config.PostAuthentication {
		return nil
	}
	hookData, err := authenticationHookData(user)
	if err != nil {
		log.Error("could not encode hook data", zap.Error(err))
		return err
	}
	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)
	_, err = h.config.Client.DoAuthenticationRequest(ctx, PostAuthentication, hookData, buf)
	if err != nil {
		log.Error("hook failed", zap.Error(err))
		return err
	}
	return nil
}

func (h *AuthenticationHooks) PostLogout(ctx context.Context, user *authentication.User) error {
	if !h.config.PostLogout || user == nil {
		return nil
	}
	log := h.config.Log.With(zap.String("hook", "postLogout"))
	hookData, err := authenticationHookData(user)
	if err != nil {
		log.Error("could not encode hook data", zap.Error(err))
		return err
	}
	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)
	_, err = h.config.Client.DoAuthenticationRequest(ctx, PostLogout, hookData, buf)
	if err != nil {
		log.Error("hook failed", zap.Error(err))
		return err
	}
	return nil
}

type mutatingPostAuthenticationResponse struct {
	User    authentication.User `json:"user"`
	Message string              `json:"message"`
	Status  string              `json:"status"`
}

func (h *AuthenticationHooks) MutatingPostAuthentication(ctx context.Context, user *authentication.User) (*authentication.User, error) {
	if !h.config.MutatingPostAuthentication {
		return user, nil
	}
	log := h.config.Log.With(zap.String("hook", "mutatingPostAuthentication"))
	return runMutatingAuthenticationHook(ctx, MutatingPostAuthentication, h.config.Client, log, user)
}

func (h *AuthenticationHooks) RevalidateAuthentication(ctx context.Context, user *authentication.User) (*authentication.User, error) {
	if !h.config.Revalidate {
		return user, nil
	}
	log := h.config.Log.With(zap.String("hook", "revalidateAuthentication"))
	result, err := runMutatingAuthenticationHook(ctx, RevalidateAuthentication, h.config.Client, log, user)
	if err != nil {
		return nil, err
	}
	result.AccessToken = user.AccessToken
	result.IdToken = user.IdToken
	return result, nil
}

func authenticationHookData(user *authentication.User) ([]byte, error) {
	hookData := []byte(`{}`)
	userJson, err := json.Marshal(user)
	if err != nil {
		return nil, err
	}
	hookData, err = jsonparser.Set(hookData, userJson, "__wg", "user")
	if err != nil {
		return nil, err
	}
	if user.AccessToken != nil {
		hookData, err = jsonparser.Set(hookData, user.AccessToken, "access_token")
		if err != nil {
			return nil, err
		}
	}
	if user.IdToken != nil {
		hookData, err = jsonparser.Set(hookData, user.IdToken, "id_token")
		if err != nil {
			return nil, err
		}
	}

	return hookData, nil
}

func runMutatingAuthenticationHook(ctx context.Context, hook MiddlewareHook, client *Client, log *zap.Logger, user *authentication.User) (*authentication.User, error) {
	hookData, err := authenticationHookData(user)
	if err != nil {
		log.Error("could not encode hook data", zap.Error(err))
		return nil, err
	}
	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)
	out, err := client.DoAuthenticationRequest(ctx, hook, hookData, buf)
	if err != nil {
		log.Error("hook failed", zap.Error(err))
		return nil, err
	}
	if err := out.ResponseError(); err != nil {
		log.Error("returned an error", zap.Error(err))
		return nil, AuthenticationDeniedError(err.Error())
	}
	var res mutatingPostAuthenticationResponse
	if err := json.Unmarshal(out.Response, &res); err != nil {
		log.Error("decoding response", zap.Error(err))
		return nil, err
	}
	if res.Status != "ok" {
		log.Error("status is not ok", zap.String("message", res.Message))
		return nil, AuthenticationDeniedError(res.Message)
	}
	return &res.User, nil
}
