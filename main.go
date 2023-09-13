package main

import (
	"fmt"
	"log"
	"encoding/json"
	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"net/http"
	"os"
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

	request := bnet.Request{
		Locale:    "en_US",
		Namespace: "dynamic-us",
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Region:    "us",
		Token:     token,
	}
	log.Printf("Requesting %s", request.Path)

	response, err := client.Get(request)
	if err != nil {
		panic(err)
	}
	log.Printf("Request complete")

	log.Printf("Initializing storage")
	storage, err := storage.NewSqlite("wow.db")
	if err != nil {
		panic(err)
	}
	log.Printf("Storage initialized")

	err = storage.Store(request, response.Body)
	if err != nil {
		panic(err)
	}

	storedResponse, err := storage.Get(request)
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
	err = json.Unmarshal(storedResponse.Body, &leaderboardJson)
	if err != nil {
		panic(err)
	}

	for _, entry := range leaderboardJson.Entries {
		fmt.Printf("%s-%s: %d\n", entry.Character.Name, entry.Character.Realm.Slug, entry.Rating)
	}
}
