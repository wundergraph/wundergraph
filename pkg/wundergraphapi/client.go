package wundergraphapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/andybalholm/brotli"
	"github.com/buger/jsonparser"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Client struct {
	accessToken string
	baseURL     string
	client      *http.Client
	log         *zap.Logger
}

func New(accessToken, baseURL string, log *zap.Logger) *Client {
	return &Client{
		accessToken: accessToken,
		client: &http.Client{
			Timeout: time.Second * 10,
		},
		baseURL: baseURL,
		log:     log,
	}
}

type graphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

func (c *Client) do(graphQLRequest graphQLRequest, response interface{}) error {
	data, err := json.Marshal(graphQLRequest)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, c.baseURL, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("accept", "application/json")
	req.Header.Set("Authorization", c.accessToken)
	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("status code: %d", res.StatusCode)
	}
	data, err = ioutil.ReadAll(res.Body)
	if err != nil {
		return err
	}
	errors, _, _, _ := jsonparser.Get(data, "errors")
	if errors != nil {
		return fmt.Errorf("errors: %s\n", string(errors))
	}
	return json.Unmarshal(data, response)
}

type UserInfoResponse struct {
	Data struct {
		User *struct {
			ID         string `json:"id"`
			Name       string `json:"name"`
			Email      string `json:"email"`
			Namespaces *[]struct {
				ID      string `json:"id"`
				Name    string `json:"name"`
				Members *[]struct {
					Membership string `json:"membership"`
					User       struct {
						ID    string `json:"id"`
						Name  string `json:"name"`
						Email string `json:"email"`
					} `json:"user"`
				}
				Environments *[]struct {
					ID              string `json:"id"`
					Name            string `json:"name"`
					PrimaryHostName string `json:"primaryHostName"`
					Primary         bool   `json:"primary"`
				} `json:"environments"`
			}
		} `json:"user"`
	} `json:"data"`
}

func (c *Client) UserInfo() (*UserInfoResponse, error) {
	info := &UserInfoResponse{}
	err := c.do(graphQLRequest{
		Query: `query {
				  user {
					id
					name
					email
					namespaces {
					  ...NamespaceFragment
					}
					accessTokens {
					  id
					  name
					  createdAt
					}
				  }
				}
				fragment ApiFragment on Api {
				  id
				  name
				  visibility
				  markdownDescription
				  deployments {
					id
					name
					config
					environments {
				  		id
						name
					}
				  }
				}
				
				fragment EnvFragment on Environment {
				  id
				  name
				  primaryHostName
				  hostNames
				  primary
				  edges {
					id
					name
					location
				  }
				}
				
				fragment NamespaceFragment on Namespace {
				  id
				  name
				  members {
					membership
					user {
					  id
					  name
					  email
					}
				  }
				  environments {
					...EnvFragment
				  }
				  apis {
					...ApiFragment
				  }
				}`,
	}, info)
	return info, err
}

type CreateOrUpdateDeploymentInput struct {
	WunderGraphConfiguration *wgpb.WunderGraphConfiguration
}

type CreateOrUpdateDeploymentResponse struct {
	Data struct {
		DeploymentCreateOrUpdate struct {
			Created struct {
				ID           string `json:"id"`
				Name         string `json:"name"`
				Environments []struct {
					ID              string `json:"id"`
					Name            string `json:"name"`
					PrimaryHostName string `json:"primaryHostName"`
				} `json:"environments"`
			} `json:"created"`
			Updated struct {
				ID           string `json:"id"`
				Name         string `json:"name"`
				Environments []struct {
					ID              string `json:"id"`
					Name            string `json:"name"`
					PrimaryHostName string `json:"primaryHostName"`
				} `json:"environments"`
			} `json:"updated"`
			ErrorCode    string `json:"code"`
			ErrorMessage string `json:"message"`
		} `json:"deploymentCreateOrUpdate"`
	} `json:"data"`
}

func (c *Client) CreateOrUpdateDeployment(input CreateOrUpdateDeploymentInput) (*CreateOrUpdateDeploymentResponse, error) {
	if input.WunderGraphConfiguration == nil {
		return nil, fmt.Errorf("WunderGraphConfiguration must not be nil")
	}
	if input.WunderGraphConfiguration.ApiId == "" {
		return nil, fmt.Errorf("ApiID must not be empty")
	}
	if len(input.WunderGraphConfiguration.EnvironmentIds) == 0 {
		return nil, fmt.Errorf("environment IDs must not be nil")
	}
	if input.WunderGraphConfiguration.Api == nil {
		return nil, fmt.Errorf("api must not be nil")
	}
	configData, err := json.Marshal(input.WunderGraphConfiguration)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal api config")
	}
	var response CreateOrUpdateDeploymentResponse
	err = c.do(graphQLRequest{
		Query: `mutation ($input: CreateOrUpdateDeployment!) {
				  deploymentCreateOrUpdate(
					input: $input
				  ) {
					... on DeploymentCreated {
					  created: deployment {
						...DeploymentFragment
					  }
					}
					... on DeploymentUpdated {
					  updated: deployment {
						...DeploymentFragment
					  }
					}
					... on Error {
					  code
					  message
					}
				  }
				}
				fragment DeploymentFragment on Deployment {
				  id
				  name
				  environments {
					id
					name
					primaryHostName
				  }
				}`,
		Variables: map[string]interface{}{
			"input": map[string]interface{}{
				"apiID":          input.WunderGraphConfiguration.ApiId,
				"name":           input.WunderGraphConfiguration.DeploymentName,
				"config":         string(configData),
				"environmentIDs": input.WunderGraphConfiguration.EnvironmentIds,
			},
		},
	}, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (c *Client) SendWunderNodeAnalytics(data []byte) {

	buf := &bytes.Buffer{}
	writer := brotli.NewWriterLevel(buf, brotli.DefaultCompression)
	_, err := writer.Write(data)
	if err != nil {
		c.log.Error("wundergraphapi.Client.SendWunderNodeAnalytics.http.NewRequest", zap.Error(err))
		return
	}

	err = writer.Flush()
	if err != nil {
		c.log.Error("wundergraphapi.Client.SendWunderNodeAnalytics.writer.Flush", zap.Error(err))
		return
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/wundernode/analytics", buf)
	if err != nil {
		c.log.Error("wundergraphapi.Client.SendWunderNodeAnalytics.http.NewRequest", zap.Error(err))
		return
	}
	req.Header.Set("Content-Encoding", "br")
	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	res, err := c.client.Do(req)
	if err != nil {
		c.log.Error("wundergraphapi.Client.SendWunderNodeAnalytics.client.Do", zap.Error(err))
		return
	}
	if res.StatusCode != http.StatusOK {
		c.log.Error("wundergraphapi.Client.SendWunderNodeAnalytics.res.StatusCode",
			zap.Int("code", res.StatusCode),
			zap.String("message", res.Status),
		)
	}
}
