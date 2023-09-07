package main

import (
	"encoding/json"
	"fmt"
	"github.com/crbednarz/moonkinmetrics/scanner/pkg/bnet"
	"io"
	"net/http"
	"os"
)

func main() {
	client := bnet.NewRateLimitedClient(&http.Client{})
	token, err := bnet.Authenticate(
		client,
		os.Getenv("WOW_CLIENT_ID"),
		os.Getenv("WOW_CLIENT_SECRET"),
	)

	if err != nil {
		panic(err)
	}

	request := bnet.Request{
		Locale:    "en_US",
		Namespace: "dynamic-us",
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Region:    "us",
		Token:     token,
	}

	response, err := bnet.Get(client, request)
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
	body, err := io.ReadAll(response.Body)
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(body, &leaderboardJson)
	if err != nil {
		panic(err)
	}

	for _, entry := range leaderboardJson.Entries {
		fmt.Printf("%s-%s: %d\n", entry.Character.Name, entry.Character.Realm.Slug, entry.Rating)
	}
}
