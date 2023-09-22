package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

func main() {
	log.Printf("Starting up")
	httpClient := &http.Client{}
	token, err := bnet.Authenticate(
		httpClient,
		os.Getenv("WOW_CLIENT_ID"),
		os.Getenv("WOW_CLIENT_SECRET"),
	)
	if err != nil {
		panic(err)
	}
	client := bnet.NewClient(httpClient)
	log.Printf("Authentication complete")

	storage, err := storage.NewSqlite("wow.db")
	if err != nil {
		panic(err)
	}
	log.Printf("Storage initialized")
	scan := scan.NewScanner(storage, client)

	response, err := client.Get(bnet.Request{
		Locale:    "en_US",
		Namespace: "dynamic-us",
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Region:    "us",
		Token:     token,
	})

	if err != nil {
		panic(err)
	}
	
	leaderboardJson := struct {
		Entries []struct {
			Character struct {
				Name  string `json:"name"`
				Realm struct {
					Slug string `json:"slug"`
					Key  struct {
						Href string `json:"href"`
						Bref string `json:"bref"`
					} `json:"key"`
				} `json:"realm"`
			} `json:"character"`
			Rating  int `json:"rating"`
			Faction struct {
				Type string `json:"type"`
			} `json:"faction"`
		} `json:"entries"`
	}{}
	err = json.Unmarshal(response.Body, &leaderboardJson)
	if err != nil {
		panic(err)
	}
	log.Printf("Leaderboard retrieved")

	requestBuilder := bnet.RequestBuilder{
		Locale: "en_US",
		Region: "us",
		Token: token,
	}

	requests := make(chan scan.RefreshRequest, len(leaderboardJson.Entries) * 2)
	results := make(chan scan.RefreshResult, len(leaderboardJson.Entries) * 2)
	scan.Refresh(requests, results)
	for _, entry := range leaderboardJson.Entries {
		requests <- scan.RefreshRequest{
			ApiRequest: requestBuilder.Build(
				fmt.Sprintf(
					"/profile/wow/character/%s/%s",
					entry.Character.Realm.Slug,
					strings.ToLower(entry.Character.Name),
				),
				"profile-us",
			),
			Lifespan: 24 * time.Hour,
			Validator: nil,
		}
		requests <- scan.RefreshRequest{
			ApiRequest: requestBuilder.Build(
				fmt.Sprintf(
					"/profile/wow/character/%s/%s/specializations",
					entry.Character.Realm.Slug,
					strings.ToLower(entry.Character.Name),
				),
				"profile-us",
			),
			Lifespan: 24 * time.Hour,
			Validator: nil,
		}
	}
	close(requests)

	for result := range results {
		if result.Err != nil {
			log.Printf("Error: %s", result.Err)
		} else {
			log.Printf("Success: %s", result.ApiRequest.Path)

		}
	}
}
