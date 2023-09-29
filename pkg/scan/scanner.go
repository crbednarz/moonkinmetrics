package scan

import (
	"errors"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

var (
	// ErrNotFound is for requests that 404'd from Blizzard's API.
	// This happens periodically for valid requests.
	ErrNotFound = errors.New("not found")

	// ErrFailedValidation is for requests that failed validation.
	ErrFailedValidation = errors.New("failed validation")
)

// Scanner is a utility for querying and caching responses from the Blizzard API.
type Scanner struct {
	storage    storage.ResponseStorage
	client     *bnet.Client
	maxRetries int
}

// RefreshRequest is a request to refresh a response.
type RefreshRequest struct {
	// Lifespan is the duration the response should be cached for.
	Lifespan   time.Duration
	ApiRequest bnet.Request
	Validator  validate.Validator
}

// RefreshResult is the result of a refresh request.
// If the request fails, the Error field will be set and the Body field will be nil.
type RefreshResult struct {
	Age        time.Duration
	ApiRequest bnet.Request
	Body       []byte
	Error      error
}

// NewScanner creates a new scanner instance.
func NewScanner(storage storage.ResponseStorage, client *bnet.Client) *Scanner {
	return &Scanner{
		storage:    storage,
		client:     client,
		maxRetries: 10,
	}
}

// RefreshSingle takes a single request and attempts to retrieve it from storage.
// If the request is missing from storage or expired, the API will be queried.
// The result is returned, with failed results setting the Error field and a nil Body.
// Validation only occurs on API responses, not cached responses.
func (s *Scanner) RefreshSingle(request RefreshRequest) RefreshResult {
	result := s.getCached(request)

	if result.Body != nil {
		return result
	}

	return s.getFromApi(request)
}

// Refresh takes a channel of requests and attempts to retrieve them from storage.
// If the request is missing from storage or expired, the API will be queried.
// The results are sent to the results channel, with failed results setting the Error field and a nil Body.
// Validation only occurs on API responses, not cached responses.
// Note that the scanner will block should the results channel be full.
func (s *Scanner) Refresh(requests <-chan RefreshRequest, results chan<- RefreshResult) {
	apiRequests := make(chan RefreshRequest, cap(requests))
	workerCount := min(max(1, cap(requests)), 100)
	for i := 0; i < workerCount; i++ {
		go s.apiWorker(apiRequests, results)
	}

	go func() {
		for request := range requests {
			result := s.getCached(request)

			if result.Body == nil {
				apiRequests <- request
			} else {
				results <- result
			}
		}
	}()
}

func (s *Scanner) apiWorker(requests <-chan RefreshRequest, results chan<- RefreshResult) {
	for request := range requests {
		results <- s.getFromApi(request)
	}
}

func (s *Scanner) getFromApi(request RefreshRequest) RefreshResult {
	result := RefreshResult{
		ApiRequest: request.ApiRequest,
		Age:        -1,
		Body:       nil,
		Error:      nil,
	}

	for i := 0; i < s.maxRetries; i++ {
		apiResponse, err := s.client.Get(request.ApiRequest)

		if err != nil {
			result.Error = fmt.Errorf("failed to retrieve response for %s: %w", request.ApiRequest.Path, err)
			continue
		}

		if apiResponse.StatusCode == 404 {
			// 404 errors typically don't resolve over multiple requests, so we can break here.
			result.Error = ErrNotFound
			break
		}

		if apiResponse.StatusCode >= 300 {
			result.Error = fmt.Errorf("failed to retrieve response for %s: %d", request.ApiRequest.Path, apiResponse.StatusCode)
			continue
		}

		if request.Validator != nil && !request.Validator.IsValid(apiResponse.Body) {
			result.Error = fmt.Errorf("response for %s failed validation", request.ApiRequest)
			continue
		}
		err = s.storage.Store(result.ApiRequest, apiResponse.Body, request.Lifespan)
		if err != nil {
			// While we can technically continue here, a storage failure is important enough to fail the whole request.
			result.Error = fmt.Errorf("failed to store response for %s: %w", result.ApiRequest, err)
			break
		}
		result.Error = nil
		result.Body = apiResponse.Body
		result.Age = 0
		break
	}
	return result
}

func (s *Scanner) getCached(request RefreshRequest) RefreshResult {
	result := RefreshResult{
		ApiRequest: request.ApiRequest,
		Age:        -1,
		Body:       nil,
	}
	storedResponse, err := s.storage.Get(request.ApiRequest)

	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			return result
		}
		result.Error = fmt.Errorf("failed to retrieve response for %s: %w", request, err)
		return result
	}

	result.Body = storedResponse.Body
	result.Age = time.Since(storedResponse.Timestamp)

	return result
}
