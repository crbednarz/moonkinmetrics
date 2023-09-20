package scanner

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

type MockHttpClient struct {
    FailAfterFirst bool
    ShouldFail bool
}

func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
    defer func() {
        if m.FailAfterFirst {
            m.ShouldFail = true
        }
    }()

    if m.ShouldFail {
        return nil, fmt.Errorf("mock http client failed")
    }

    responseBody := fmt.Sprintf(`{"path":"%s"}`, req.URL.Path)
    response := &http.Response{
        StatusCode: 200,
        Body: io.NopCloser(strings.NewReader(responseBody)),
    }

    return response, nil
}

func newMockScanner(httpClient *MockHttpClient) (*Scanner, error) {
    if httpClient == nil {
        httpClient = &MockHttpClient{
            FailAfterFirst: false,
            ShouldFail: false,
        }
    }
    client := bnet.NewClient(httpClient)
    cache, err := storage.NewSqlite(":memory:")
    if err != nil {
        return nil, err
    }

    scanner := New(
        cache,
        client,
    )

    return scanner, nil
}

func newMockRequest(path string) RefreshRequest {
    return RefreshRequest{
        MaxAge: 0,
        ApiRequest: bnet.Request{
            Locale: "mock_Locale",
            Region: "mock-region",
            Namespace: "mock-namespace",
            Token: "mock_token",
            Path: path,
        },
        Validator: nil,
    }
}

func TestSingleRefresh(t *testing.T) {
    scanner, err := newMockScanner(nil)
    if err != nil {
        t.Error(err)
    }

    request := newMockRequest("/data/wow/mock/path")
    result := scanner.RefreshSingle(request)

    if result.Err != nil {
        t.Errorf("Expected no error, got %v", result.Err)
    }

    if string(result.Body) != `{"path":"/data/wow/mock/path"}` {
        t.Errorf("Expected body to be %s, got %s", `{"path":"/data/wow/mock/path"}`, string(result.Body))
    } 
}

func TestMultiRefresh(t *testing.T) {
    scanner, err := newMockScanner(nil)
    if err != nil {
        t.Error(err)
    }

    requests := make(chan RefreshRequest, 10)
    results := make(chan RefreshResult, 10)

    scanner.Refresh(requests, results)

    for i := 0; i < 10; i++ {
        requests <- newMockRequest(fmt.Sprintf("/data/wow/mock/%d", i))
    }
    close(requests)


    remainingResults := map[string]string{}
    for i := 0; i < 10; i++ {
        key := fmt.Sprintf("/data/wow/mock/%d", i)
        value := fmt.Sprintf(`{"path":"%s"}`, key)
        remainingResults[key] = value
    }

    for i := 0; i < 10; i++ {
        result := <-results
        if result.Err != nil {
            t.Errorf("Expected no error, got %v", result.Err)
        }

        body := remainingResults[result.ApiRequest.Path]
        if string(result.Body) != body {
            t.Errorf("Expected body to be %s, got %s", body, string(result.Body))
        }
        delete(remainingResults, result.ApiRequest.Path)
    }

    if len(remainingResults) != 0 {
        t.Errorf("Expect all results to be processed, but %d remain", len(remainingResults))
    }
}

func TestCachedRefresh(t *testing.T) {
    scanner, err := newMockScanner(&MockHttpClient{
        FailAfterFirst: true,
        ShouldFail: false,
    })
    if err != nil {
        t.Error(err)
    }

    requests := make(chan RefreshRequest)
    results := make(chan RefreshResult)
    scanner.Refresh(requests, results)
    requests <- newMockRequest("/data/wow/mock/path")
    close(requests)
    result := <-results

    requests = make(chan RefreshRequest)
    scanner.Refresh(requests, results)
    requests <- newMockRequest("/data/wow/mock/path")
    close(requests)
    result = <-results
    if result.Err != nil {
        t.Errorf("Expected no error, got %v", result.Err)
    }

    if string(result.Body) != `{"path":"/data/wow/mock/path"}` {
        t.Errorf("Expected body to be %s, got %s", `{"path":"/data/wow/mock/path"}`, string(result.Body))
    } 
}
