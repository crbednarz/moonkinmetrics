package api

import "net/http"

type Request interface {
	HttpRequest(token string) (*http.Request, error)

	// Returns a string which can uniquely identify the request.
	// This is used for caching and logging.
	Id() string
}
