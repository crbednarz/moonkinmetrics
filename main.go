package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/seasons"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

func main() {
	log.Printf("Starting up")
	client := bnet.NewClient(
		&http.Client{},
		os.Getenv("WOW_CLIENT_ID"),
		os.Getenv("WOW_CLIENT_SECRET"),
	)
	err := client.Authenticate()
	if err != nil {
		panic(fmt.Errorf("failed to authenticate: %v", err))
	}
	log.Printf("Authentication complete")

	storage, err := storage.NewSqlite("wow.db")
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
}
