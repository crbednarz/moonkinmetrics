package api

type Response struct {
	Body       []byte
	Request    *Request
	StatusCode int
	Attempts   int
}
