package api

import (
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"
)

const mockBody = `{"mock":"body"}`

type MockHttpClient struct {
	accessToken     string
	reponseDelay    time.Duration
	invalidateAfter int
	requestCount    int
	lock            sync.Mutex
}

func NewMockHttpClient() *MockHttpClient {
	return &MockHttpClient{
		reponseDelay:    0,
		invalidateAfter: -1,
		requestCount:    0,
	}
}

func (m *MockHttpClient) SetResponseDelay(delay time.Duration) {
	m.reponseDelay = delay
}

func (m *MockHttpClient) SetInvalidateAfter(count int) {
	m.invalidateAfter = count
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	if m.reponseDelay > 0 {
		time.Sleep(m.reponseDelay)
	}

	m.lock.Lock()
	defer m.lock.Unlock()
	if req.URL.String() == "https://oauth.battle.net/token" {
		m.accessToken = fmt.Sprintf("%x", rand.Uint64())
		response := fmt.Sprintf(`{"access_token":"%s"}`, m.accessToken)
		return &http.Response{
			StatusCode: 200,
			Body:       io.NopCloser(strings.NewReader(response)),
		}, nil
	}

	if req.URL.String() != "https://us.api.blizzard.com/data/wow/mock/path?locale=en_US&namespace=profile-us" {
		return nil, fmt.Errorf("unexpected url: %s", req.URL.String())
	}

	if req.Header.Get("Authorization") != fmt.Sprintf("Bearer %s", m.accessToken) {
		return &http.Response{
			StatusCode: 403,
			Body:       io.NopCloser(strings.NewReader(`{"error":"Forbidden","message":"Forbidden"}`)),
		}, nil
	}

	if req.Header.Get("Accept") != "application/json" {
		return nil, fmt.Errorf("unexpected Accept header: %s", req.Header.Get("Accept"))
	}

	m.requestCount++
	if m.invalidateAfter > 0 && m.requestCount > m.invalidateAfter {
		m.requestCount = 0
		m.accessToken = ""
		return &http.Response{
			StatusCode: 403,
			Body:       io.NopCloser(strings.NewReader(`{"error":"Forbidden","message":"Forbidden"}`)),
		}, nil
	}

	return &http.Response{
		StatusCode: 200,
		Body:       io.NopCloser(strings.NewReader(mockBody)),
	}, nil
}

func TestClientCanGet(t *testing.T) {
	request := BnetRequest{
		Region:    RegionUS,
		Namespace: NamespaceProfile,
		Path:      "/data/wow/mock/path",
	}

	client := NewClient(
		NewMockHttpClient(),
		WithAuthentication("https://oauth.battle.net/token", "mock_client_id", "mock_client_secret"),
	)
	client.Authenticate()

	response, err := client.Get(&request)
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

func TestClientReauthenticates(t *testing.T) {
	request := BnetRequest{
		Region:    RegionUS,
		Namespace: NamespaceProfile,
		Path:      "/data/wow/mock/path",
	}

	httpClient := NewMockHttpClient()
	httpClient.SetInvalidateAfter(2)
	// httpClient.SetResponseDelay(1 * time.Second)

	client := NewClient(
		httpClient,
		WithAuthentication("https://oauth.battle.net/token", "mock_client_id", "mock_client_secret"),
	)
	client.Authenticate()

	for i := 0; i < 4; i++ {
		response, err := client.Get(&request)
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
}
