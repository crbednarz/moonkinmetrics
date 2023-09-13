package bnet

import (
    "fmt"
    "net/http"
    "net/url"
)

// A WoW API request.
type Request struct {
    Locale string
    Namespace string
    Path string
    Region string
    Token string
}

// Returns the url.URL representation of the WoW API request.
// This does not include the authorization header, so is typically used for logging.
func (r *Request) Url() *url.URL {
    query := url.Values{}
    query.Set("locale", r.Locale)
    query.Set("namespace", r.Namespace)
    return &url.URL{
        Scheme: "https",
        Host: fmt.Sprintf("%s.api.blizzard.com", r.Region),
        Path: r.Path,
        RawQuery: query.Encode(),
    }
}

// Returns the string representation of the WoW API request.
// This is equivalent to Url().String().
func (r *Request) String() string {
    return r.Url().String()
}

// Creates an http.Request from the WoW API request.
// This includes the authorization header, unlike Url() and String().
func (r *Request) HttpRequest() (*http.Request, error) {
    request, err := http.NewRequest("GET", r.String(), nil)
    if err != nil {
        return nil, err
    }
    request.Header.Add("Authorization", fmt.Sprintf("Bearer %s", r.Token))
    request.Header.Add("Accept", "application/json")
    return request, nil
}

// A RequestBuilder allows requests to be built with typically static parameters.
// These consist of the locale, region, and token.
// Typically only one builder will be needed per region.
type RequestBuilder struct {
    Locale string
    Region string
    Token string
}

// Build creates a new WoW API request with the given path and namespace.
func (b *RequestBuilder) Build(path string, namespace string) *Request {
    return &Request{
        Locale: b.Locale,
        Namespace: namespace,
        Path: path,
        Region: b.Region,
        Token: b.Token,
    }
}
