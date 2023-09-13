package bnet

import (
	"context"
	"io"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type Client struct {
	httpClient HttpClient
	limiter *rate.Limiter
}

func NewClient(client HttpClient) *Client {
	return &Client{
		httpClient: client,
		limiter: rate.NewLimiter(rate.Every(time.Second), 100),
	}
}

func (c *Client) Get(request Request) (*Response, error) {
	httpRequest, err := request.HttpRequest()
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	if err := c.limiter.Wait(ctx); err != nil {
		return nil, err
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
		Body: body,
		Request: &request,
		StatusCode: response.StatusCode,
	}, err
}
