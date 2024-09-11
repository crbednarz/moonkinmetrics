package bnet

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
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
}

type clientOptions struct {
	ClientId     string
	ClientSecret string
	UseLimiter   bool
}

type ClientOption interface {
	apply(*clientOptions)
}

type limiterOption bool

func (l limiterOption) apply(o *clientOptions) {
	o.UseLimiter = bool(l)
}

func WithLimiter(l bool) ClientOption {
	return limiterOption(l)
}

type bnetCredentialsOption struct {
	clientId     string
	clientSecret string
}

func (b bnetCredentialsOption) apply(o *clientOptions) {
	o.ClientId = b.clientId
	o.ClientSecret = b.clientSecret
}

func WithCredentials(clientId, clientSecret string) ClientOption {
	return bnetCredentialsOption{
		clientId:     clientId,
		clientSecret: clientSecret,
	}
}

func NewClient(client HttpClient, opts ...ClientOption) *Client {
	options := clientOptions{
		UseLimiter: true,
	}
	for _, opt := range opts {
		opt.apply(&options)
	}

	limiter := rate.NewLimiter(rate.Every(time.Second/100), 10)
	if !options.UseLimiter {
		limiter = nil
	}

	return &Client{
		httpClient:   client,
		limiter:      limiter,
		clientId:     options.ClientId,
		clientSecret: options.ClientSecret,
	}
}

func (c *Client) Get(request Request) (*Response, error) {
	httpRequest, err := request.HttpRequest(c.token)
	if err != nil {
		return nil, err
	}

	if c.limiter != nil {
		ctx := context.Background()
		if err := c.limiter.Wait(ctx); err != nil {
			return nil, err
		}
	}

	response, err := c.httpClient.Do(httpRequest)
	if err != nil {
		return nil, err
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return &Response{
		Body:       body,
		Request:    &request,
		StatusCode: response.StatusCode,
	}, err
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