package v2wundergraphapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"go.uber.org/zap"
)

type apiError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}
type Client struct {
	accessToken string
	baseURL     string
	client      *http.Client
	log         *zap.Logger
}

func New(accessToken string, baseURL string, client *http.Client, log *zap.Logger) *Client {
	return &Client{
		accessToken: accessToken,
		baseURL:     baseURL,
		client:      client,
		log:         log,
	}
}

func (c *Client) do(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.accessToken))
	req.Header.Set("Accept", "application/json")
	if req.Method == "POST" {
		req.Header.Set("Content-Type", "application/json")
	}
	return c.client.Do(req)
}

type ApiDependency struct {
	Organization        string        `json:"organization"`
	Name                string        `json:"name"`
	Keywords            []string      `json:"keywords"`
	ShortDescription    string        `json:"shortDescription"`
	MarkdownDescription string        `json:"markdownDescription"`
	RepositoryURL       string        `json:"repositoryUrl"`
	SDKVersion          string        `json:"sdkVersion"`
	Definition          interface{}   `json:"definition"`
	IsPublic            bool          `json:"isPublic"`
	Placeholders        []Placeholder `json:"placeholders"`
}

type Placeholder struct {
	Name     string `json:"name"`
	Optional bool   `json:"optional"`
}

func (c *Client) GetApiDependency(dep string) (*ApiDependency, error) {
	var dependency ApiDependency

	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/v1/apis/"+dep, nil)
	if err != nil {
		return nil, fmt.Errorf("could not build request for api dependency '%s'", dep)
	}

	resp, err := c.do(req)
	if err != nil {
		return nil, fmt.Errorf("could not fetch api dependency '%s': %w", dep, err)
	}

	if resp.StatusCode != 200 {
		var apiErr apiError
		err := json.NewDecoder(resp.Body).Decode(&apiErr)
		if err != nil {
			c.log.Warn("could not encode api error")
		}
		return nil, fmt.Errorf("could not fetch api '%s', error: %s", dep, apiErr.Error)
	}

	content, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("could not read api dependency '%s': %w", dep, err)
	}

	defer resp.Body.Close()

	err = json.Unmarshal(content, &dependency)
	if err != nil {
		return nil, fmt.Errorf("could not decode api dependency '%s': %w", dep, err)
	}

	return &dependency, nil
}

func (c *Client) PublishApiDependency(dependency ApiDependency) error {
	b := new(bytes.Buffer)
	err := json.NewEncoder(b).Encode(dependency)
	if err != nil {
		return fmt.Errorf("could not encode api dependency '%s': %w", dependency.Name, err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/v1/organizations/"+dependency.Organization+"/apis", b)
	if err != nil {
		return fmt.Errorf("could not build request for api publish '%s': %w", dependency.Name, err)
	}

	resp, err := c.do(req)
	if err != nil {
		return fmt.Errorf("could not publish api '%s': %w", dependency.Name, err)
	}

	if resp.StatusCode != 200 {
		var apiErr apiError
		err := json.NewDecoder(resp.Body).Decode(&apiErr)
		if err != nil {
			c.log.Error("could not encode api error", zap.Error(err))
		}
		return fmt.Errorf("could not publish api '%s', statusCode: %d", dependency.Name, resp.StatusCode)
	}

	return nil
}

func (c *Client) RegisterCliUserWithAccessToken() error {
	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/cli/register", nil)
	if err != nil {
		return err
	}

	res, err := c.do(req)
	if err != nil {
		return err
	}

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		switch res.StatusCode {
		case http.StatusUnauthorized:
			return ErrInvalidLogin
		default:
			return fmt.Errorf("could not register cli user, statusCode: %d", res.StatusCode)
		}
	}

	return nil
}

type UserInfo struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	FirstName   string   `json:"firstname"`
	LastName    string   `json:"lastname"`
	DisplayName string   `json:"displayName"`
	PictureURL  string   `json:"pictureUrl"`
	Roles       []string `json:"roles"`
}

var (
	ErrInvalidLogin = fmt.Errorf("invalid login")
)

func (c *Client) GetUserInfo() (*UserInfo, error) {
	var userInfo UserInfo
	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/auth/userinfo", nil)
	if err != nil {
		return nil, err
	}

	res, err := c.do(req)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		switch res.StatusCode {
		case http.StatusUnauthorized:
			return nil, ErrInvalidLogin
		default:
			return nil, fmt.Errorf("could not fetch userinfo, statusCode: %d", res.StatusCode)
		}
	}

	content, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(content, &userInfo)

	return &userInfo, err
}
