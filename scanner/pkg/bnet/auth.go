package bnet

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// Requests access token from Battle.net API using client credentials.
// This token will need to be included with future requests as a bearer token.
func Authenticate(client HttpClient, clientId string, clientSecret string) (string, error) {
	values := url.Values{}
	values.Set("grant_type", "client_credentials")
	authRequest, err := http.NewRequest(
		"POST",
		"https://oauth.battle.net/token",
		strings.NewReader(values.Encode()),
	)
	if err != nil {
		return "", fmt.Errorf("unable to create authentication request: %w", err)
	}
	authRequest.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	authRequest.SetBasicAuth(clientId, clientSecret)

	response, err := client.Do(authRequest)
	if err != nil {
		return "", fmt.Errorf("authentication error: %w", err)
	}

	if response.StatusCode != 200 {
		return "", fmt.Errorf("authentication failed with code: %s", response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", fmt.Errorf("authentication has invalid body: %w", err)
	}

	authResponse := struct {
		AccessToken string `json:"access_token"`
	}{}

	err = json.Unmarshal(body, &authResponse)

	if err != nil {
		return "", fmt.Errorf("authentication cannot parse response: %w", err)
	}

	return authResponse.AccessToken, nil
}
