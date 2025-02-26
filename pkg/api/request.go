package api

import "net/http"

type Request interface {
	HttpRequest(token string) (*http.Request, error)
}
