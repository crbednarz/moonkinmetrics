package talents

import (
	_ "embed"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/storage"
)

var (
	//go:embed testdata/valid-index.json
	validIndex string

	//go:embed testdata/bad-link-index.json
	badLinkIndex string

	//go:embed testdata/missing-data-index.json
	missingDataIndex string
)

type mockHttpClient struct {
	IndexBody string
}

func (m *mockHttpClient) Do(req *http.Request) (*http.Response, error) {
	response := &http.Response{
		StatusCode: 200,
		Body:       io.NopCloser(strings.NewReader(m.IndexBody)),
	}

	return response, nil
}

func newMockScanner(indexBody string) (*scan.Scanner, error) {
	client := bnet.NewClient(
		&mockHttpClient{
			IndexBody: indexBody,
		},
		"mock_client_id",
		"mock_client_secret",
	)
	cache, err := storage.NewSqlite(":memory:")
	if err != nil {
		return nil, err
	}

	return scan.NewScanner(
		cache,
		client,
	), nil
}

func TestGetTalentTreeIndex(t *testing.T) {
	scanner, err := newMockScanner(validIndex)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	index, err := GetTalentTreeIndex(scanner)
	if err != nil {
		t.Fatalf("failed to get talent tree index: %v", err)
	}

	if len(index.ClassLinks) != 15 {
		t.Fatalf("expected 15 class links, got %d", len(index.ClassLinks))
	}

	if len(index.SpecLinks) != 40 {
		t.Fatalf("expected 40 spec links, got %d", len(index.SpecLinks))
	}
}

func TestTalentTreeIndexMissingDataFails(t *testing.T) {
	scanner, err := newMockScanner(missingDataIndex)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetTalentTreeIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestTalentTreeIndexBadLinkFails(t *testing.T) {
	scanner, err := newMockScanner(badLinkIndex)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetTalentTreeIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
