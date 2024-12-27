package bnet

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// Client is a rate limited HTTP client for the Battle.net API.
// Note that Authenticate must be called before making any requests.
type Client struct {
	httpClient   HttpClient
	limiter      *rate.Limiter
	clientId     string
	clientSecret string
	token        string
	authLock     sync.RWMutex
}

type clientOptions struct {
	bnetCredentialsOption
	limiterOption
}

type ClientOption interface {
	apply(*clientOptions)
}

type limiterOption bool

func (l limiterOption) apply(o *clientOptions) {
	o.limiterOption = limiterOption(l)
}

func WithLimiter(l bool) ClientOption {
	return limiterOption(l)
}

type bnetCredentialsOption struct {
	clientId     string
	clientSecret string
}

func (b bnetCredentialsOption) apply(o *clientOptions) {
	o.bnetCredentialsOption = b
}

func WithCredentials(clientId, clientSecret string) ClientOption {
	return bnetCredentialsOption{
		clientId:     clientId,
		clientSecret: clientSecret,
	}
}

func NewClient(client HttpClient, opts ...ClientOption) *Client {
	options := clientOptions{
		limiterOption: limiterOption(true),
	}
	for _, opt := range opts {
		opt.apply(&options)
	}

	limiter := rate.NewLimiter(rate.Every(time.Second/100), 10)
	if !options.limiterOption {
		limiter = nil
	}

	return &Client{
		httpClient:   client,
		limiter:      limiter,
		clientId:     options.clientId,
		clientSecret: options.clientSecret,
	}
}

func (c *Client) Get(request Request) (*Response, error) {
	var response *http.Response
	var err error
	attempts := 0

	for {
		ctx := context.TODO()
		if c.limiter != nil {
			err := c.limiter.Wait(ctx)
			if err != nil {
				return nil, err
			}
		}

		response, err = c.doAuthenticatedRequest(request)
		attempts++
		if err != nil {
			return nil, err
		}

		if response.StatusCode == 429 {
			log.Printf("Rate limited, waiting")
			err = c.limiter.WaitN(ctx, 5)
			if err != nil {
				return nil, err
			}
			continue
		}

		break
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return &Response{
		Body:       body,
		Request:    &request,
		StatusCode: response.StatusCode,
		Attempts:   attempts,
	}, err
}

func (c *Client) doAuthenticatedRequest(request Request) (*http.Response, error) {
	needsReauthentication := false
	var token string
	for {
		if needsReauthentication {
			c.refreshAuthentication(token)
			needsReauthentication = false
		}

		c.authLock.RLock()
		defer c.authLock.RUnlock()
		token = c.token
		httpRequest, err := request.HttpRequest(token)
		if err != nil {
			return nil, err
		}

		response, err := c.httpClient.Do(httpRequest)
		if response.StatusCode == 403 {
			needsReauthentication = true
			continue
		}
		return response, err
	}
}

// Refreshes access token from Battle.net API if previousToken matches the current token.
// This is used to prevent multiple requests from refreshing the token at the same time.
func (c *Client) refreshAuthentication(previousToken string) error {
	c.authLock.Lock()
	defer c.authLock.Unlock()
	if previousToken == c.token {
		log.Printf("Refreshing authentication token")
		return c.Authenticate()
	} else {
		log.Printf("Token already refreshed")
	}
	return nil
}

// Refreshes access token from Battle.net API using stored client credentials.
// This must be called before making any requests to the API.
// This token will need to be included with future requests as a bearer token.
func (c *Client) Authenticate() error {
	values := url.Values{}
	values.Set("grant_type", "client_credentials")
	authRequest, err := http.NewRequest(
		"POST",
		"https://oauth.battle.net/token",
		strings.NewReader(values.Encode()),
	)
	if err != nil {
		return fmt.Errorf("unable to create authentication request: %w", err)
	}
	authRequest.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	authRequest.SetBasicAuth(c.clientId, c.clientSecret)

	response, err := c.httpClient.Do(authRequest)
	if err != nil {
		return fmt.Errorf("authentication error: %w", err)
	}

	if response.StatusCode != 200 {
		return fmt.Errorf("authentication failed with code: %s", response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return fmt.Errorf("authentication has invalid body: %w", err)
	}

	authResponse := struct {
		AccessToken string `json:"access_token"`
	}{}

	err = json.Unmarshal(body, &authResponse)
	if err != nil {
		return fmt.Errorf("authentication cannot parse response: %w", err)
	}

	c.token = authResponse.AccessToken
	return nil
}
