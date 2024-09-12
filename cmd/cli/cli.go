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
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/seasons"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/serialize"
	"github.com/crbednarz/moonkinmetrics/pkg/site"
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

	region := bnet.RegionUS

	leaderboard, err := seasons.GetCurrentLeaderboard(scanner, "3v3", region)
	if err != nil {
		panic(err)
	}
	log.Printf("Leaderboard retrieved: %v", leaderboard)

	enrichedLeaderboards, err := site.EnrichLeaderboard(scanner, &leaderboard, trees)
	if err != nil {
		panic(err)
	}

	for i := range enrichedLeaderboards {
		leaderboard := &enrichedLeaderboards[i]

		data, err := serialize.ExportLeaderboardToJson(leaderboard)
		if err != nil {
			panic(err)
		}

		fileName := fmt.Sprintf("%s-%s.us.json", leaderboard.ClassName, leaderboard.SpecName)
		fileName = strings.ReplaceAll(fileName, " ", "-")
		fileName = strings.ToLower(fileName)

		path := fmt.Sprintf("ui/wow/pvp/%s/%s", leaderboard.Bracket, fileName)
		if strings.HasPrefix(leaderboard.Bracket, "shuffle") {
			path = fmt.Sprintf("ui/wow/pvp/shuffle/%s", fileName)
		}
		os.WriteFile(path, data, 0644)
		log.Printf("Exported %s", path)
	}

	for i := range trees {
		tree := &trees[i]
		err = writeTalents(tree)
		if err != nil {
			panic(err)
		}
	}
	log.Printf("Exported talents to json")
}

func writeTalents(tree *wow.TalentTree) error {
	serializedTalents, err := serialize.ExportTalentsToJson(tree)
	if err != nil {
		return err
	}
	err = os.MkdirAll("ui/wow/talents/", 0755)
	if err != nil {
		return err
	}

	fileName := fmt.Sprintf("%s-%s.json", tree.ClassName, tree.SpecName)
	fileName = strings.ReplaceAll(fileName, " ", "-")
	fileName = strings.ToLower(fileName)

	os.WriteFile(
		fmt.Sprintf("ui/wow/talents/%s", fileName),
		serializedTalents,
		0644,
	)

	return nil
}
