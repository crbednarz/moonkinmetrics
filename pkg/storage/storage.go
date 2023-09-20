package storage

import (
	"errors"
	"time"
	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
)

var ErrNotFound = errors.New("storage: not found")

type StoredResponse struct {
    Body []byte
    Timestamp time.Time
}

type Response struct {
    Body []byte
    Request bnet.Request
}

type ResponseStorage interface {
    // Stores response for later retrieval by request.
    Store(request bnet.Request, response []byte) error

    // Stores set of responses, ensuring that all responses are stored or none are.
    StoreLinked(responses []Response) error

    // Retrieves response for request.
    Get(request bnet.Request) (StoredResponse, error)
}
