package scan

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/repair"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

type MockHttpClient struct {
	FailAfterFirst bool
	ShouldFail     bool
}

type MockResponseObject struct {
	Path string `json:"path"`
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
		Body:       io.NopCloser(strings.NewReader(responseBody)),
	}

	return response, nil
}

func newMockScanner(httpClient *MockHttpClient) (*Scanner, error) {
	if httpClient == nil {
		httpClient = &MockHttpClient{
			FailAfterFirst: false,
			ShouldFail:     false,
		}
	}
	client := bnet.NewClient(httpClient, "mock_client_id", "mock_client_secret")
	cache, err := storage.NewSqlite(":memory:", storage.SqliteOptions{})
	if err != nil {
		return nil, err
	}

	scanner := NewScanner(
		cache,
		client,
	)

	return scanner, nil
}

func newMockRefreshRequest(path string) RefreshRequest {
	return RefreshRequest{
		Lifespan: time.Hour,
		ApiRequest: bnet.Request{
			Region:    bnet.RegionUS,
			Namespace: bnet.NamespaceProfile,
			Path:      path,
		},
		Validator: nil,
	}
}

func newMockRequest(path string) bnet.Request {
	return bnet.Request{
		Region:    bnet.RegionUS,
		Namespace: bnet.NamespaceProfile,
		Path:      path,
	}
}

func newMockOptions[T any]() ScanOptions[T] {
	return ScanOptions[T]{
		Validator: nil,
		Repairs:   nil,
		Lifespan:  time.Hour,
	}
}

func TestSingleScan(t *testing.T) {
	scanner, err := newMockScanner(nil)
	if err != nil {
		t.Error(err)
	}

	request := newMockRequest("/data/wow/mock/path")
	options := newMockOptions[MockResponseObject]()

	result := ScanSingle(scanner, request, &options)

	if result.Error != nil {
		t.Errorf("Expected no error, got %v", result.Error)
	}

	if result.Response.Path != "/data/wow/mock/path" {
		t.Errorf("Expected path to be %s, got %s", "/data/wow/mock/path", result.Response.Path)
	}
}

func TestSingleScanRepair(t *testing.T) {
	scanner, err := newMockScanner(nil)
	if err != nil {
		t.Error(err)
	}

	request := newMockRequest("/")
	validator, err := validate.NewSchemaValidator[MockResponseObject](`
  {
    "type": "object",
    "require": ["path"],
    "properties": {
      "path": {
        "type": "string",
        "minLength": 5
      }
    }
  }`)
	if err != nil {
		t.Errorf("Failed to create schema validator: %v", err)
	}
	options := ScanOptions[MockResponseObject]{
		Validator: validator,
		Repairs: []repair.Repairer[MockResponseObject]{
			repair.NewRepair(func(obj *MockResponseObject) error {
				obj.Path = "/data/wow/mock/path"
				return nil
			}),
		},
		Lifespan: time.Hour,
	}

	result := ScanSingle(scanner, request, &options)

	if result.Error != nil {
		t.Errorf("Expected no error, got %v", result.Error)
	}

	if result.Response.Path != "/data/wow/mock/path" {
		t.Errorf("Expected path to be %s, got %s", "/data/wow/mock/path", result.Response.Path)
	}
}

func TestSingleRefresh(t *testing.T) {
	scanner, err := newMockScanner(nil)
	if err != nil {
		t.Error(err)
	}

	request := newMockRefreshRequest("/data/wow/mock/path")
	result := scanner.RefreshSingle(request)

	if result.Error != nil {
		t.Errorf("Expected no error, got %v", result.Error)
	}

	if string(result.Body) != `{"path":"/data/wow/mock/path"}` {
		t.Errorf("Expected body to be %s, got %s", `{"path":"/data/wow/mock/path"}`, string(result.Body))
	}
}

func TestMultiScan(t *testing.T) {
	scanner, err := newMockScanner(nil)
	if err != nil {
		t.Error(err)
	}

	requests := make(chan bnet.Request, 10)
	results := make(chan ScanResult[MockResponseObject], 10)
	options := newMockOptions[MockResponseObject]()

	Scan(scanner, requests, results, &options)

	for i := 0; i < 10; i++ {
		requests <- newMockRequest(fmt.Sprintf("/data/wow/mock/%d", i))
	}
	close(requests)

	remainingResults := map[string]string{}
	for i := 0; i < 10; i++ {
		key := fmt.Sprintf("/data/wow/mock/%d", i)
		value := key
		remainingResults[key] = value
	}

	for i := 0; i < 10; i++ {
		result := <-results
		if result.Error != nil {
			t.Errorf("Expected no error, got %v", result.Error)
		}

		body := remainingResults[result.ApiRequest.Path]
		if string(result.Response.Path) != body {
			t.Errorf("Expected body to be %s, got %s", body, string(result.Response.Path))
		}
		delete(remainingResults, result.ApiRequest.Path)
	}

	if len(remainingResults) != 0 {
		t.Errorf("Expect all results to be processed, but %d remain", len(remainingResults))
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
		requests <- newMockRefreshRequest(fmt.Sprintf("/data/wow/mock/%d", i))
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
		if result.Error != nil {
			t.Errorf("Expected no error, got %v", result.Error)
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
		ShouldFail:     false,
	})
	if err != nil {
		t.Error(err)
	}

	requests := make(chan RefreshRequest)
	results := make(chan RefreshResult)
	scanner.Refresh(requests, results)
	requests <- newMockRefreshRequest("/data/wow/mock/path")
	close(requests)
	result := <-results

	requests = make(chan RefreshRequest)
	scanner.Refresh(requests, results)
	requests <- newMockRefreshRequest("/data/wow/mock/path")
	close(requests)
	result = <-results
	if result.Error != nil {
		t.Errorf("Expected no error, got %v", result.Error)
	}

	if string(result.Body) != `{"path":"/data/wow/mock/path"}` {
		t.Errorf("Expected body to be %s, got %s", `{"path":"/data/wow/mock/path"}`, string(result.Body))
	}
}

func TestCachedScan(t *testing.T) {
	scanner, err := newMockScanner(&MockHttpClient{
		FailAfterFirst: true,
		ShouldFail:     false,
	})
	if err != nil {
		t.Error(err)
	}

	requests := make(chan bnet.Request)
	results := make(chan ScanResult[MockResponseObject])
	options := newMockOptions[MockResponseObject]()

	Scan(scanner, requests, results, &options)
	requests <- newMockRequest("/data/wow/mock/path")
	close(requests)
	result := <-results

	requests = make(chan bnet.Request)
	Scan(scanner, requests, results, &options)
	requests <- newMockRequest("/data/wow/mock/path")
	close(requests)
	result = <-results
	if result.Error != nil {
		t.Errorf("Expected no error, got %v", result.Error)
	}

	if string(result.Response.Path) != "/data/wow/mock/path" {
		t.Errorf("Expected path to be %s, got %s", "/data/wow/mock/path", result.Response.Path)
	}
}
