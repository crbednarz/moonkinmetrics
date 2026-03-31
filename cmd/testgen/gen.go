package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

type Downloader struct {
	HttpClient *http.Client
	SaveResult bool
}

func (d *Downloader) Do(req *http.Request) (*http.Response, error) {
	res, err := d.HttpClient.Do(req)
	if err != nil {
		return res, err
	}

	// We don't want to cache our token
	if req.URL.Path == "/token" || !d.SaveResult {
		return res, nil
	}

	// Skip media because we don't use it for testing
	if strings.HasPrefix(req.URL.Path, "/data/wow/media") {
		return res, nil
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	res.Body = io.NopCloser(bytes.NewReader(body))

	// Skip broken talents
	if req.URL.Path != "/data/wow/talent/index" && strings.HasPrefix(req.URL.Path, "/data/wow/talent/") && !bytes.Contains(body, []byte("\"spell\"")) {
		return res, nil
	}

	// Skip all pvp talents except 100
	// (contents don't matter for pvp talents, so we can just use 100 as a template)
	if strings.HasPrefix(req.URL.Path, "/data/wow/pvp-talent/") && req.URL.Path != "/data/wow/pvp-talent/100" &&
		req.URL.Path != "/data/wow/pvp-talent/index" {
		return res, nil
	}

	path := fmt.Sprintf("pkg/testutils/testdata%v", req.URL.Path)

	dirPath := filepath.Dir(path)
	err = os.MkdirAll(dirPath, 0o755)
	if err != nil {
		return nil, err
	}

	err = os.WriteFile(path, body, 0o644)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func main() {
	log.Printf("Starting up")

	httpClient := &Downloader{
		HttpClient: &http.Client{},
		SaveResult: false,
	}

	client := api.NewClient(
		httpClient,
		api.WithAuthentication(
			"https://oauth.battle.net/token",
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

	httpClient.SaveResult = true

	storage, err := storage.NewSqlite(":memory:", storage.SqliteOptions{})
	if err != nil {
		panic(err)
	}
	log.Printf("Storage initialized")
	scanner, err := scan.NewScanner(storage, client)
	if err != nil {
		panic(err)
	}

	_, err = talents.GetTalentTrees(scanner)
	if err != nil {
		panic(err)
	}
}
