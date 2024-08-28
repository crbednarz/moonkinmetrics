package scan

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/repair"
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

type ScanResult[T any] struct {
	Response   T
	Error      error
	ApiRequest bnet.Request
	Index      int64
}

type ScanOptions[T any] struct {
	Validator validate.Validator[T]
	Repairs   []repair.Repairer[T]
	Lifespan  time.Duration
}

type indexedRequest struct {
	ApiRequest bnet.Request
	Index      int64
}

type cacheResponse struct {
	Body  []byte
	Age   time.Duration
	Index int64
}

// RefreshRequest is a request to refresh a response.
type RefreshRequest struct {
	// Lifespan is the duration the response should be cached for.
	Validator  validate.LegacyValidator
	ApiRequest bnet.Request
	Lifespan   time.Duration
}

type legacyIndexedRequest struct {
	Validator  validate.LegacyValidator
	ApiRequest bnet.Request
	Lifespan   time.Duration
	Index      int64
}

// RefreshResult is the result of a refresh request.
// If the request fails, the Error field will be set and the Body field will be nil.
type RefreshResult struct {
	ApiRequest bnet.Request
	Error      error
	Body       []byte
	Age        time.Duration
	Index      int64
}

// NewScanner creates a new scanner instance.
func NewScanner(storage storage.ResponseStorage, client *bnet.Client) *Scanner {
	return &Scanner{
		storage:    storage,
		client:     client,
		maxRetries: 10,
	}
}

func Scan[T any](scanner *Scanner, requests <-chan bnet.Request, results chan<- ScanResult[T], options *ScanOptions[T]) {
	apiRequests := make(chan indexedRequest, cap(requests))
	workerCount := min(max(1, cap(requests)), 100)
	for i := 0; i < workerCount; i++ {
		go apiScanWorker(scanner, apiRequests, results, options)
	}

	go func() {
		var index int64 = 0
		for apiRequest := range requests {
			request := indexedRequest{
				ApiRequest: apiRequest,
				Index:      index,
			}
			result := ScanResult[T]{
				ApiRequest: apiRequest,
				Index:      index,
			}
			index++

			result.Error = buildFromCache(scanner, request.ApiRequest, options, &result.Response)

			if result.Error == nil {
				results <- result
			} else {
				apiRequests <- request
			}
		}
	}()
}

func apiScanWorker[T any](scanner *Scanner, requests <-chan indexedRequest, results chan<- ScanResult[T], options *ScanOptions[T]) {
	for request := range requests {
		result := ScanResult[T]{
			ApiRequest: request.ApiRequest,
			Index:      request.Index,
		}
		result.Error = buildFromApi(scanner, request.ApiRequest, options, &result.Response)
		results <- result
	}
}

func ScanSingle[T any](scanner *Scanner, request bnet.Request, options *ScanOptions[T]) ScanResult[T] {
	result := ScanResult[T]{
		ApiRequest: request,
		Index:      0,
	}

	err := buildFromCache(scanner, request, options, &result.Response)
	if err == nil {
		return result
	}

	result.Error = buildFromApi(scanner, request, options, &result.Response)
	return result
}

func buildFromCache[T any](scanner *Scanner, request bnet.Request, options *ScanOptions[T], output *T) error {
	cachedResponse, err := scanner.getCached(request)
	if err != nil {
		return err
	}

	err = buildFromJson(cachedResponse, options, output)
	if err != nil {
		// If parsing fails we should reset the result to an empty object
		var emptyObject T
		*output = emptyObject
		log.Printf("Error building from cached response: %v", err)
	}
	return err
}

func buildFromApi[T any](scanner *Scanner, request bnet.Request, options *ScanOptions[T], output *T) error {
	var lastError error
	for i := 0; i < scanner.maxRetries; i++ {
		lastError = nil
		apiResponse, err := scanner.client.Get(request)
		if err != nil {
			lastError = fmt.Errorf("failed to retrieve response for %s: %w", request.Path, err)
			continue
		}

		if apiResponse.StatusCode == 404 {
			// 404 errors typically don't resolve over multiple requests, so we can break here.
			return ErrNotFound
		}

		if apiResponse.StatusCode >= 300 {
			lastError = fmt.Errorf("failed to retrieve response for %s: %d", request.Path, apiResponse.StatusCode)
			continue
		}

		err = buildFromJson(apiResponse.Body, options, output)
		if err != nil {
			return fmt.Errorf("response for %s failed validation", request.Path)
		}

		err = scanner.storage.Store(request, apiResponse.Body, options.Lifespan)
		if err != nil {
			// While we can technically continue here, a storage failure is important enough to fail the whole request.
			return fmt.Errorf("failed to store response for %s: %w", request, err)
		} else {
			return nil
		}
	}
	return lastError
}

func buildFromJson[T any](body []byte, options *ScanOptions[T], output *T) error {
	err := json.Unmarshal(body, output)
	if err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if options.Validator == nil {
		return nil
	}

	if options.Validator.IsValid(output) {
		return nil
	}

	if options.Repairs != nil {
		for _, repairer := range options.Repairs {
			err = repairer.Repair(output)
			if err != nil {
				return fmt.Errorf("failed to repair response: %w", err)
			}
		}
	}

	if !options.Validator.IsValid(output) {
		return ErrFailedValidation
	}

	return nil
}

func (s *Scanner) getCached(request bnet.Request) ([]byte, error) {
	storedResponse, err := s.storage.Get(request)
	if err != nil {
		return nil, err
	}
	return storedResponse.Body, nil
}

// RefreshSingle takes a single request and attempts to retrieve it from storage.
// If the request is missing from storage or expired, the API will be queried.
// The result is returned, with failed results setting the Error field and a nil Body.
// Validation only occurs on API responses, not cached responses.
func (s *Scanner) RefreshSingle(request RefreshRequest) RefreshResult {
	requestWithIndex := request.indexedRequest(0)
	result := s.legacyGetCached(requestWithIndex)

	if result.Body != nil {
		return result
	}
	return s.legacyGetFromApi(requestWithIndex)
}

// Refresh takes a channel of requests and attempts to retrieve them from storage.
// If the request is missing from storage or expired, the API will be queried.
// The results are sent to the results channel, with failed results setting the Error field and a nil Body.
// Validation only occurs on API responses, not cached responses.
// Note that the scanner will block should the results channel be full.
func (s *Scanner) Refresh(requests <-chan RefreshRequest, results chan<- RefreshResult) {
	apiRequests := make(chan legacyIndexedRequest, cap(requests))
	workerCount := min(max(1, cap(requests)), 100)
	for i := 0; i < workerCount; i++ {
		go s.apiWorker(apiRequests, results)
	}

	go func() {
		var index int64 = 0
		for request := range requests {
			request := request.indexedRequest(index)
			result := s.legacyGetCached(request)

			if result.Body == nil {
				apiRequests <- request
				index++
			} else {
				results <- result
			}
		}
	}()
}

func (s *Scanner) apiWorker(requests <-chan legacyIndexedRequest, results chan<- RefreshResult) {
	for request := range requests {
		results <- s.legacyGetFromApi(request)
	}
}

func (s *Scanner) legacyGetFromApi(request legacyIndexedRequest) RefreshResult {
	result := RefreshResult{
		ApiRequest: request.ApiRequest,
		Age:        -1,
		Body:       nil,
		Error:      nil,
		Index:      request.Index,
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
			// Validation errors tend to not resolve with retries
			result.Error = fmt.Errorf("response for %s failed validation", request.ApiRequest)
			break
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

func (s *Scanner) legacyGetCached(request legacyIndexedRequest) RefreshResult {
	result := RefreshResult{
		ApiRequest: request.ApiRequest,
		Age:        -1,
		Body:       nil,
		Index:      request.Index,
	}
	storedResponse, err := s.storage.Get(request.ApiRequest)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			return result
		}
		result.Error = fmt.Errorf("failed to retrieve response for %v: %w", request, err)
		return result
	}

	result.Body = storedResponse.Body
	result.Age = time.Since(storedResponse.Timestamp)

	return result
}

func (r *RefreshRequest) indexedRequest(referenceIndex int64) legacyIndexedRequest {
	return legacyIndexedRequest{
		Validator:  r.Validator,
		ApiRequest: r.ApiRequest,
		Lifespan:   r.Lifespan,
		Index:      referenceIndex,
	}
}
