package scan

import (
	"context"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

type metricsReporter interface {
	ReportRequest(ctx context.Context)
	ReportResult(ctx context.Context, resultDetails ScanResultDetails)
}

type otelMetricsReporter struct {
	requests metric.Int64Counter
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
	return &otelMetricsReporter{
		requests: requestCounter,
	}, nil
}

func (o *otelMetricsReporter) ReportRequest(ctx context.Context) {
	o.requests.Add(ctx, 1)
}

func (o *otelMetricsReporter) ReportResult(ctx context.Context, resultDetails ScanResultDetails) {
	attributeSet := attribute.NewSet(
		attribute.Bool("success", resultDetails.Success),
		attribute.Bool("cached", resultDetails.Cached),
		attribute.Bool("repaired", resultDetails.Repaired),
		attribute.Int("api_attempts", resultDetails.ApiAttempts),
		attribute.Int("api_errors", resultDetails.ApiErrors),
	)
	o.requests.Add(ctx, 1,
		metric.WithAttributeSet(attributeSet),
	)
}

func (e *emptyScanMetrics) ReportRequest(ctx context.Context) {
}

func (e *emptyScanMetrics) ReportResult(ctx context.Context, resultDetails ScanResultDetails) {
}
