package bnet

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
)

const mockBody = `{"mock":"body"}`

type MockHttpClient struct {
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	if req.URL.String() == "https://oauth.battle.net/token" {
		return &http.Response{
			StatusCode: 200,
			Body: io.NopCloser(strings.NewReader(`{"access_token":"mock_token"}`)),
		}, nil
	}

	if req.URL.String() != "https://us.api.blizzard.com/data/wow/mock/path?locale=en_US&namespace=profile-us" {
		return nil, fmt.Errorf("unexpected url: %s", req.URL.String())
	}

	if req.Header.Get("Authorization") != "Bearer mock_token" {
		return nil, fmt.Errorf("unexpected Authorization header: %s", req.Header.Get("Authorization"))
	}

	if req.Header.Get("Accept") != "application/json" {
		return nil, fmt.Errorf("unexpected Accept header: %s", req.Header.Get("Accept"))
	}

	return &http.Response{
		StatusCode: 200,
		Body: io.NopCloser(strings.NewReader(mockBody)),
	}, nil
}


func TestClientCanGet(t *testing.T) {
	request := Request{
		Region: RegionUS,
		Namespace: NamespaceProfile,
		Path: "/data/wow/mock/path",
	}

	client := NewClient(&MockHttpClient{}, "mock_client_id", "mock_client_secret")
	client.Authenticate()

	response, err := client.Get(request)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if response.StatusCode != 200 {
		t.Errorf("Expected status code 200, got %d", response.StatusCode)
	}

	if string(response.Body) != mockBody {
		t.Errorf("Expected body to be %s, got %s", mockBody, string(response.Body))
	}
}
