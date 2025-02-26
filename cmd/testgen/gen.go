package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

func main() {
	log.Printf("Starting up")

	httpClient := &http.Client{}

	client := api.NewClient(
		httpClient,
		api.WithCredentials(
			os.Getenv("WOW_CLIENT_ID"),
			os.Getenv("WOW_CLIENT_SECRET"),
		),
		api.WithLimiter(true),
	)

	err := client.Authenticate()
	if err != nil {
		panic(fmt.Errorf("failed to authenticate: %v", err))
	}
	log.Printf("Authentication complete")

	storage, err := storage.NewSqlite(":memory:", storage.SqliteOptions{})
	if err != nil {
		panic(err)
	}
	log.Printf("Storage initialized")
	scanner, err := scan.NewScanner(storage, client)
	if err != nil {
		panic(err)
	}

	err = downloadTalentResponses(client, scanner)
	if err != nil {
		panic(err)
	}
	log.Printf("Test data generated")
}

func downloadTalentResponses(client *api.Client, scanner *scan.Scanner) error {
	index, err := talents.GetTalentTreeIndex(scanner)
	if err != nil {
		return err
	}

	for _, specLink := range index.SpecLinks {
		request, err := api.RequestFromUrl(specLink.Url)
		if err != nil {
			return err
		}
		err = downloadRequest(client, request)
		if err != nil {
			return err
		}
	}

	staticAssets := []string{
		"/data/wow/talent-tree/index",
		"/data/wow/pvp-talent/index",
		"/data/wow/pvp-talent/5599",
		"/data/wow/talent/108105",
	}

	for _, path := range staticAssets {
		err = downloadRequest(client, api.BnetRequest{
			Region:    api.RegionUS,
			Namespace: api.NamespaceStatic,
			Path:      path,
		})
		if err != nil {
			return err
		}

	}
	return nil
}

func downloadRequest(client *api.Client, request api.BnetRequest) error {
	response, err := client.Get(&request)
	if err != nil {
		return err
	}
	path := fmt.Sprintf("pkg/testutils/testdata%v", request.Path)

	dirPath := filepath.Dir(path)
	err = os.MkdirAll(dirPath, 0755)
	if err != nil {
		return err
	}

	err = os.WriteFile(path, response.Body, 0644)
	if err != nil {
		return err
	}
	return nil
}
