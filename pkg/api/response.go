package api

type Response struct {
	Body       []byte
	Request    *BnetRequest
	StatusCode int
	Attempts   int
}
