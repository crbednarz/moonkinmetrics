package api

type Response struct {
	Body       []byte
	StatusCode int
	Attempts   int
}
