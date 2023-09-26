package bnet

type Response struct {
	Body       []byte
	Request    *Request
	StatusCode int
}
