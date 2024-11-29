package scan

import (
	"context"

	"go.opentelemetry.io/otel/metric"
)

type metricsReporter interface {
	ReportRequest(ctx context.Context)
	ReportResult(ctx context.Context, resultDetails ScanResultDetails)
}

type otelMetricsReporter struct {
	// Total requests issued
	requests metric.Int64Counter
	// Counter for processing of requests
	requestsProcessed metric.Int64Counter
	// Counter for successful processing of requests
	successes metric.Int64Counter
	// Counter for requests which could not be fulfilled
	failures metric.Int64Counter
	// Counter for requests which had valid responses cached
	cached metric.Int64Counter
	// Counter for total HTTP requests issued
	apiHits metric.Int64Counter
	// Counter for API HTTP errors encountered, regardless of success
	apiErrors metric.Int64Counter
	// Counter for responses that were successfully repaired
	repairs metric.Int64Counter
}

type emptyScanMetrics struct{}

func newEmptyMetricsReporter() metricsReporter {
	return &emptyScanMetrics{}
}

func newMetricsReporter(meter metric.Meter) (metricsReporter, error) {
	requestCounter, err := meter.Int64Counter("scan_requests")
	if err != nil {
		return nil, err
	}

	requestsProcessedCounter, err := meter.Int64Counter("scan_requests_processed")
	if err != nil {
		return nil, err
	}

	successesCounter, err := meter.Int64Counter("scan_successes")
	if err != nil {
		return nil, err
	}

	cachedCounter, err := meter.Int64Counter("scan_cached")
	if err != nil {
		return nil, err
	}

	apiHitsCounter, err := meter.Int64Counter("scan_api_hits")
	if err != nil {
		return nil, err
	}

	apiErrorsCounter, err := meter.Int64Counter("scan_api_errors")
	if err != nil {
		return nil, err
	}

	repairsCounter, err := meter.Int64Counter("scan_repairs")
	if err != nil {
		return nil, err
	}

	return &otelMetricsReporter{
		requests:          requestCounter,
		requestsProcessed: requestsProcessedCounter,
		successes:         successesCounter,
		cached:            cachedCounter,
		apiHits:           apiHitsCounter,
		apiErrors:         apiErrorsCounter,
		repairs:           repairsCounter,
	}, nil
}

func (o *otelMetricsReporter) ReportRequest(ctx context.Context) {
	o.requests.Add(ctx, 1)
}

func (o *otelMetricsReporter) ReportResult(ctx context.Context, resultDetails ScanResultDetails) {
	o.requestsProcessed.Add(ctx, 1)

	if resultDetails.Success {
		o.successes.Add(ctx, 1)
	}

	if resultDetails.Cached {
		o.cached.Add(ctx, 1)
	}

	if resultDetails.Repaired {
		o.repairs.Add(ctx, 1)
	}

	o.apiHits.Add(ctx, int64(resultDetails.ApiAttempts))
	o.apiErrors.Add(ctx, int64(resultDetails.ApiErrors))
}

func (e *emptyScanMetrics) ReportRequest(ctx context.Context) {
}

func (e *emptyScanMetrics) ReportResult(ctx context.Context, resultDetails ScanResultDetails) {
}
