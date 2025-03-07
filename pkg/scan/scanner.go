package scan

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/bytedance/sonic"
	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

// ErrNotFound is for requests that 404'd from Blizzard's API.
// This happens periodically for valid requests.
var ErrNotFound = errors.New("not found")

// Scanner is a utility for querying and caching responses from the Blizzard API.
type Scanner struct {
	storage         storage.ResponseStorage
	client          *api.Client
	metricsReporter metricsReporter
	maxRetries      int
}

type ScanResultDetails struct {
	Cached      bool
	ApiAttempts int
	ApiErrors   int
	Repaired    bool
	Success     bool
}

type ScanResult[T any] struct {
	Response   T
	Error      error
	ApiRequest api.Request
	Index      int64
	Details    ScanResultDetails
}

type ScanOptions[T any] struct {
	Validator validate.Validator[T]
	Filters   []ResultProcessor[T]
	Repairs   []ResultProcessor[T]
	Lifespan  time.Duration
}

type indexedRequest struct {
	ApiRequest api.Request
	Index      int64
}

type cacheResponse struct {
	Body  []byte
	Age   time.Duration
	Index int64
}

func NewScanner(storage storage.ResponseStorage, client *api.Client, opts ...ScannerOption) (*Scanner, error) {
	options := scannerOptions{
		maxRetriesOption: maxRetriesOption{10},
	}
	for _, opt := range opts {
		opt.apply(&options)
	}

	metricsReporter := newEmptyMetricsReporter()
	if options.meter != nil {
		metrics, err := newMetricsReporter(options.meter)
		if err != nil {
			return nil, err
		}
		metricsReporter = metrics
	}

	return &Scanner{
		storage:         storage,
		client:          client,
		maxRetries:      options.maxRetries,
		metricsReporter: metricsReporter,
	}, nil
}

func Scan[T any](scanner *Scanner, requests <-chan api.Request, results chan<- ScanResult[T], options *ScanOptions[T]) {
	ctx := context.TODO()
	apiRequests := make(chan indexedRequest, cap(requests))
	workerCount := min(max(1, cap(requests)), 100)
	var wg sync.WaitGroup

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			for request := range apiRequests {
				result := ScanResult[T]{
					ApiRequest: request.ApiRequest,
					Index:      request.Index,
				}
				buildFromApi(ctx, scanner, request.ApiRequest, options, &result)
				scanner.metricsReporter.Report(ctx, result.Details)
				results <- result
			}
			wg.Done()
		}()
	}

	go func() {
		var index int64 = 0
		for apiRequest := range requests {
			result := ScanResult[T]{
				ApiRequest: apiRequest,
				Index:      index,
			}

			buildFromCache(ctx, scanner, apiRequest, options, &result)

			if result.Error == nil {
				scanner.metricsReporter.Report(ctx, result.Details)
				results <- result
			} else {
				result.Error = nil
				request := indexedRequest{
					ApiRequest: apiRequest,
					Index:      index,
				}
				apiRequests <- request
			}
			index++
		}
		close(apiRequests)
		wg.Wait()

		close(results)
	}()
}

func ScanSingle[T any](scanner *Scanner, request api.Request, options *ScanOptions[T]) ScanResult[T] {
	ctx := context.TODO()

	result := ScanResult[T]{
		ApiRequest: request,
		Index:      0,
	}

	buildFromCache(ctx, scanner, request, options, &result)
	if result.Error == nil {
		scanner.metricsReporter.Report(ctx, result.Details)
		return result
	}

	result.Error = nil
	buildFromApi(ctx, scanner, request, options, &result)
	scanner.metricsReporter.Report(ctx, result.Details)
	return result
}

func buildFromCache[T any](ctx context.Context, scanner *Scanner, request api.Request, options *ScanOptions[T], result *ScanResult[T]) {
	cachedResponse, err := scanner.storage.Get(request)
	if err != nil {
		result.Error = err
		return
	}

	repaired, err := buildFromJson(cachedResponse.Body, options, &result.Response)
	result.Error = err
	if err != nil {
		// If parsing fails we should reset the result to an empty object
		var emptyObject T
		result.Response = emptyObject
		log.Printf("Error building from cached response: %v", err)
	} else {
		result.Details.Repaired = repaired
		result.Details.Cached = true
		result.Details.Success = true
	}
}

func buildFromApi[T any](ctx context.Context, scanner *Scanner, request api.Request, options *ScanOptions[T], result *ScanResult[T]) {
	var lastError error
	for i := 0; i < scanner.maxRetries; i++ {
		lastError = nil
		apiResponse, err := scanner.client.Get(request)
		if err != nil {
			lastError = fmt.Errorf("failed to retrieve response for %s: %w", request.Id(), err)
			continue
		}

		result.Details.ApiAttempts += apiResponse.Attempts

		if apiResponse.StatusCode == 404 {
			// 404 errors typically don't resolve over multiple requests, so we can break here.
			result.Details.ApiErrors++
			result.Error = ErrNotFound
			return
		}

		if apiResponse.StatusCode >= 300 {
			lastError = fmt.Errorf("failed to retrieve response for %s: %d", request.Id(), apiResponse.StatusCode)
			result.Details.ApiErrors++
			continue
		}

		repaired, err := buildFromJson(apiResponse.Body, options, &result.Response)
		if err != nil {
			result.Error = fmt.Errorf("response for %s failed validation: %w", request.Id(), err)
			return
		}

		err = scanner.storage.Store(request, apiResponse.Body, options.Lifespan)
		if err != nil {
			// While we can technically continue here, a storage failure is important enough to fail the whole request.
			result.Error = fmt.Errorf("failed to store response for %s: %w", request, err)
		} else {
			result.Details.Repaired = repaired
			result.Details.Success = true
		}
		return
	}
	result.Error = lastError
}

func buildFromJson[T any](body []byte, options *ScanOptions[T], output *T) (repaired bool, err error) {
	err = sonic.Unmarshal(body, output)
	if err != nil {
		return
	}

	if options.Validator == nil {
		err = processResult(options, output)
		return
	}

	err = options.Validator.IsValid(output)
	if err == nil {
		err = processResult(options, output)
		return
	}

	if options.Repairs != nil {
		for _, repairer := range options.Repairs {
			err = repairer.Process(output)
			if err != nil {
				return
			}
		}
	} else {
		err = fmt.Errorf("failed to validate response: %w", err)
		return
	}

	err = options.Validator.IsValid(output)
	if err != nil {
		err = fmt.Errorf("failed to validate response: %w", err)
		return
	}

	repaired = true
	err = processResult(options, output)
	return
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
