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
	authRequest.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	authRequest.SetBasicAuth(clientId, clientSecret)

	if err != nil {
		return "", err
	}

	response, err := client.Do(authRequest)
	if err != nil {
		return "", err
	}

	if response.StatusCode != 200 {
		return "", fmt.Errorf("failed to authorize: %s", response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	authResponse := struct {
		AccessToken string `json:"access_token"`
	}{}

	err = json.Unmarshal(body, &authResponse)

	if err != nil {
		return "", err
	}

	return authResponse.AccessToken, nil
}
