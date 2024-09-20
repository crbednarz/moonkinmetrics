package scan

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

// ErrNotFound is for requests that 404'd from Blizzard's API.
// This happens periodically for valid requests.
var ErrNotFound = errors.New("not found")

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
	Filters   []ResultProcessor[T]
	Repairs   []ResultProcessor[T]
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
	var wg sync.WaitGroup
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go apiScanWorker(scanner, apiRequests, results, options, &wg)
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
		close(apiRequests)
		wg.Wait()

		close(results)
	}()
}

func apiScanWorker[T any](scanner *Scanner, requests <-chan indexedRequest, results chan<- ScanResult[T], options *ScanOptions[T], wg *sync.WaitGroup) {
	for request := range requests {
		result := ScanResult[T]{
			ApiRequest: request.ApiRequest,
			Index:      request.Index,
		}
		result.Error = buildFromApi(scanner, request.ApiRequest, options, &result.Response)
		results <- result
	}
	wg.Done()
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
			return fmt.Errorf("response for %s failed validation: %w", request.Path, err)
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
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.UseNumber()

	err := decoder.Decode(output)
	if err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if options.Validator == nil {
		return processResult(options, output)
	}

	err = options.Validator.IsValid(output)
	if err == nil {
		return processResult(options, output)
	}

	if options.Repairs != nil {
		for _, repairer := range options.Repairs {
			err = repairer.Process(output)
			if err != nil {
				return fmt.Errorf("failure during respone repair: %w", err)
			}
		}
	} else {
		return fmt.Errorf("failed to validate response: %w", err)
	}

	err = options.Validator.IsValid(output)
	if err != nil {
		return fmt.Errorf("failed to validate response: %w", err)
	}

	return processResult(options, output)
}

func processResult[T any](options *ScanOptions[T], output *T) error {
	if options.Filters == nil {
		return nil
	}

	for _, filter := range options.Filters {
		err := filter.Process(output)
		if err != nil {
			return fmt.Errorf("failed to filter response: %w", err)
		}
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
