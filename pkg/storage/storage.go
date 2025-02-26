package storage

import (
	"errors"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
)

var ErrNotFound = errors.New("storage: not found")

type StoredResponse struct {
	Body      []byte
	Timestamp time.Time
}

type Response struct {
	Body    []byte
	Request api.Request
}

type CleanResult struct {
	Deleted int64
}

type ResponseStorage interface {
	// Stores response for later retrieval by request.
	Store(request api.Request, response []byte, lifespan time.Duration) error

	// Stores set of responses, ensuring that all responses are stored or none are.
	StoreLinked(responses []Response, lifespan time.Duration) error

	// Retrieves a non-expired response for the given request.
	Get(request api.Request) (StoredResponse, error)

	// Cleans up expired responses.
	Clean() (CleanResult, error)
}
