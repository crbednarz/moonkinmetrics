package api

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type Limiter struct {
	mutex   sync.Mutex
	maxRate rate.Limit
	minRate rate.Limit
	limiter *rate.Limiter
}

func NewLimiter(maxRate rate.Limit, minRate rate.Limit, burst int) *Limiter {
	limiter := rate.NewLimiter(maxRate, 10)

	return &Limiter{
		maxRate: maxRate,
		minRate: minRate,
		limiter: limiter,
	}
}

func (l *Limiter) Wait(ctx context.Context) error {
	return l.limiter.Wait(ctx)
}

func (l *Limiter) Backoff() {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	limit := l.limiter.Limit()
	limit -= rate.Every(time.Second / 10)
	limit = max(limit, l.minRate)
	l.limiter.SetLimit(limit)
}

func (l *Limiter) EaseBackoff() {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	limit := l.limiter.Limit()
	limit += rate.Every(time.Second)
	limit = min(limit, l.maxRate)
	l.limiter.SetLimit(limit)
}
