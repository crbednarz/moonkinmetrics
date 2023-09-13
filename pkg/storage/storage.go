package storage

import (
    "github.com/crbednarz/moonkinmetrics/pkg/bnet"
)

type StoredResponse struct {
    Body []byte
    Timestamp uint64
}

type ResponseStorage interface {
    Store(request bnet.Request, response []byte) error
    Get(request bnet.Request) (StoredResponse, error)
}
