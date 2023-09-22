package bnet

import (
    "fmt"
    "net/http"
    "net/url"
)

type Namespace string
type Region string

const (
    NamespaceStatic Namespace = "static"
    NamespaceDynamic Namespace = "dynamic"
    NamespaceProfile Namespace = "profile"
)

const (
    RegionUS Region = "us"
    RegionEU Region = "eu"
)

// A WoW API request.
type Request struct {
    Path string
    Region Region
    Namespace Namespace
}

// Returns the url.URL representation of the WoW API request.
// This does not include the authorization header, so is typically used for logging.
func (r *Request) Url() *url.URL {
    locale := "en_US"
    if r.Region == RegionEU {
        locale = "en_GB"
    }

    namespace := fmt.Sprintf("%s-%s", r.Namespace, r.Region)
    query := url.Values{}
    query.Set("locale", locale)
    query.Set("namespace", namespace)
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

// Creates an http.Request from the WoW API request with the given token.
// This includes the authorization header, unlike Url() and String().
func (r *Request) HttpRequest(token string) (*http.Request, error) {
    request, err := http.NewRequest("GET", r.String(), nil)
    if err != nil {
        return nil, err
    }
    request.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
    request.Header.Add("Accept", "application/json")
    return request, nil
}

