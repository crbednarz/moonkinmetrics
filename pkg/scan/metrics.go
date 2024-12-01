package scan

import (
	"context"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

type metricsReporter interface {
	Report(ctx context.Context, resultDetails ScanResultDetails)
}

type otelMetricsReporter struct {
	requests    metric.Int64Counter
	apiErrors   metric.Int64Counter
	apiAttempts metric.Int64Counter
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

	apiErrorCounter, err := meter.Int64Counter("scan_api_errors")
	if err != nil {
		return nil, err
	}

	apiAttemptsCounter, err := meter.Int64Counter("scan_api_attempts")
	if err != nil {
		return nil, err
	}
	return &otelMetricsReporter{
		requests:    requestCounter,
		apiErrors:   apiErrorCounter,
		apiAttempts: apiAttemptsCounter,
	}, nil
}

func (o *otelMetricsReporter) Report(ctx context.Context, resultDetails ScanResultDetails) {
	attributeSet := attribute.NewSet(
		attribute.Bool("success", resultDetails.Success),
		attribute.Bool("cached", resultDetails.Cached),
		attribute.Bool("repaired", resultDetails.Repaired),
	)
	o.requests.Add(ctx, 1,
		metric.WithAttributeSet(attributeSet),
	)
	o.apiErrors.Add(ctx, int64(resultDetails.ApiErrors),
		metric.WithAttributeSet(attributeSet),
	)
	o.apiAttempts.Add(ctx, int64(resultDetails.ApiAttempts),
		metric.WithAttributeSet(attributeSet),
	)
}

func (e *emptyScanMetrics) Report(ctx context.Context, resultDetails ScanResultDetails) {
}
