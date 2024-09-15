package bnet

import (
	"io"
	"net/http"
	"strings"
)

type OfflineHttpClient struct{}

func (c *OfflineHttpClient) Do(req *http.Request) (*http.Response, error) {
	response := &http.Response{
		StatusCode: 404,
		Body:       io.NopCloser(strings.NewReader("{}")),
	}

	return response, nil
}
