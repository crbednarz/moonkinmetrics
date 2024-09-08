package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"runtime/pprof"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/players"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/seasons"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type OfflineHttpClient struct{}

func (c *OfflineHttpClient) Do(req *http.Request) (*http.Response, error) {
	response := &http.Response{
		StatusCode: 404,
		Body:       io.NopCloser(strings.NewReader("{}")),
	}

	return response, nil
}

func main() {
	f, err := os.Create("./test")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)
	defer pprof.StopCPUProfile()
	log.Printf("Starting up")

	offline := true

	var httpClient bnet.HttpClient
	if offline {
		httpClient = &OfflineHttpClient{}
	} else {
		httpClient = &http.Client{}
	}
	client := bnet.NewClient(
		httpClient,
		bnet.WithCredentials(
			os.Getenv("WOW_CLIENT_ID"),
			os.Getenv("WOW_CLIENT_SECRET"),
		),
		bnet.WithLimiter(!offline),
	)

	if !offline {
		err := client.Authenticate()
		if err != nil {
			panic(fmt.Errorf("failed to authenticate: %v", err))
		}
		log.Printf("Authentication complete")
	}

	storage, err := storage.NewSqlite("wow.db", storage.SqliteOptions{
		NoExpire: offline,
	})
	if err != nil {
		panic(err)
	}
	log.Printf("Storage initialized")
	scanner := scan.NewScanner(storage, client)

	trees, err := talents.GetTalentTrees(scanner)
	if err != nil {
		panic(err)
	}
	log.Printf("Talents retrieved: %d total", len(trees))

	leaderboard, err := seasons.GetCurrentLeaderboard(scanner, "3v3")
	if err != nil {
		panic(err)
	}
	log.Printf("Leaderboard retrieved: %v", leaderboard)

	playerLinks := make([]wow.PlayerLink, len(leaderboard.Entries))
	for i, entry := range leaderboard.Entries {
		playerLinks[i] = entry.Player
	}
	loadouts, err := players.GetPlayerLoadouts(scanner, playerLinks, players.LoadoutScanOptions{})
	if err != nil {
		panic(err)
	}
	log.Printf("Loadouts retrieved: %d total", len(loadouts))
}