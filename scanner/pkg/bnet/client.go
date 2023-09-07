package bnet

import (
	"net/http"
	"time"
	"golang.org/x/time/rate"
)

type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

func Get(client HttpClient, request Request) (*http.Response, error) {
	httpRequest, err := request.HttpRequest()
	if err != nil {
		return nil, err
	}
	return client.Do(httpRequest)
}

type Client struct {
	httpClient HttpClient
	limiter *rate.Limiter
}

func NewRateLimitedClient(client HttpClient) HttpClient {
	return &Client{
		httpClient: client,
		limiter: rate.NewLimiter(rate.Every(time.Second), 100),
	}
}

func (c *Client) Do(req *http.Request) (*http.Response, error) {
	if err := c.limiter.Wait(req.Context()); err != nil {
		return nil, err
	}
	return c.httpClient.Do(req)
}
