package testutils

import (
	"io"
	"net/http"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

type MockClientCallback func(path string) (body string, found bool)

type MockHttpClient struct {
	callback MockClientCallback
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	fileName := req.URL.Path

	body, found := m.callback(fileName)
	if found {
		return &http.Response{
			StatusCode: 200,
			Body:       io.NopCloser(strings.NewReader(body)),
		}, nil
	}

	return &http.Response{
		StatusCode: 404,
		Body:       io.NopCloser(strings.NewReader("")),
	}, nil
}

func NewMockScanner(callback MockClientCallback) (*scan.Scanner, error) {
	client := bnet.NewClient(
		&MockHttpClient{callback},
		"mock_client_id",
		"mock_client_secret",
	)
	cache, err := storage.NewSqlite(":memory:", storage.SqliteOptions{})
	if err != nil {
		return nil, err
	}

	return scan.NewScanner(
		cache,
		client,
	), nil
}

func NewSingleResourceMockScanner(path string, body string) (*scan.Scanner, error) {
	return NewMockScanner(func(requestPath string) (string, bool) {
		return body, requestPath == path
	})
}
