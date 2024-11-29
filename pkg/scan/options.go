package scan

import "go.opentelemetry.io/otel/metric"

type scannerOptions struct {
	metricsOption
	maxRetriesOption
}

type ScannerOption interface {
	apply(*scannerOptions)
}

type maxRetriesOption struct {
	maxRetries int
}

func (m maxRetriesOption) apply(o *scannerOptions) {
	o.maxRetriesOption = m
}

func WithMaxRetries(retries int) ScannerOption {
	return maxRetriesOption{
		maxRetries: retries,
	}
}

type metricsOption struct {
	meter metric.Meter
}

func (m metricsOption) apply(o *scannerOptions) {
	o.metricsOption = m
}

func WithMetrics(meter metric.Meter) ScannerOption {
	return metricsOption{
		meter: meter,
	}
}
