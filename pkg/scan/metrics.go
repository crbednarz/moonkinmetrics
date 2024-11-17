package scan

import (
	"context"

	"go.opentelemetry.io/otel/metric"
)

type scanMetrics interface {
	CountRequest(ctx context.Context)
	CountCacheHit(ctx context.Context)
	CountApiHit(ctx context.Context, attempts int)
	CountApiError(ctx context.Context)
	CountSuccess(ctx context.Context)
}

type otelScanMetrics struct {
	requestCount  metric.Int64Counter
	cacheHitCount metric.Int64Counter
	apiHitCount   metric.Int64Counter
	apiErrorCount metric.Int64Counter
	successCount  metric.Int64Counter
}

type emptyScanMetrics struct{}

func newEmptyScanMetrics() scanMetrics {
	return &emptyScanMetrics{}
}

func newScanMetrics(meter metric.Meter) (scanMetrics, error) {
	requestCount, err := meter.Int64Counter("scan_requests")
	if err != nil {
		return nil, err
	}

	cacheHitCount, err := meter.Int64Counter("scan_cache_hits")
	if err != nil {
		return nil, err
	}

	apiHitCount, err := meter.Int64Counter("scan_api_hits")
	if err != nil {
		return nil, err
	}

	apiErrorCount, err := meter.Int64Counter("scan_api_errors")
	if err != nil {
		return nil, err
	}

	apiSuccessCount, err := meter.Int64Counter("scan_successes")
	if err != nil {
		return nil, err
	}

	return &otelScanMetrics{
		requestCount:  requestCount,
		cacheHitCount: cacheHitCount,
		apiHitCount:   apiHitCount,
		apiErrorCount: apiErrorCount,
		successCount:  apiSuccessCount,
	}, nil
}

func (o *otelScanMetrics) CountRequest(ctx context.Context) {
	o.requestCount.Add(ctx, 1)
}

func (o *otelScanMetrics) CountCacheHit(ctx context.Context) {
	o.cacheHitCount.Add(ctx, 1)
}

func (o *otelScanMetrics) CountApiHit(ctx context.Context, attempts int) {
	o.apiHitCount.Add(ctx, int64(attempts))
}

func (o *otelScanMetrics) CountApiError(ctx context.Context) {
	o.apiErrorCount.Add(ctx, 1)
}

func (o *otelScanMetrics) CountSuccess(ctx context.Context) {
	o.successCount.Add(ctx, 1)
}

func (e *emptyScanMetrics) CountRequest(ctx context.Context) {
}

func (e *emptyScanMetrics) CountCacheHit(ctx context.Context) {
}

func (e *emptyScanMetrics) CountApiHit(ctx context.Context, attempts int) {
}

func (e *emptyScanMetrics) CountApiError(ctx context.Context) {
}

func (e *emptyScanMetrics) CountSuccess(ctx context.Context) {
}
