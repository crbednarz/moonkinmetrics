package seasons

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
)

var (
	//go:embed testdata/valid-index.json
	validIndex string

	//go:embed testdata/bad-index.json
	badIndex string
)

func TestGetSeasonsIndex(t *testing.T) {
	scanner, err := testutils.NewSingleResourceMockScanner(
		"/data/wow/pvp-season/index",
		validIndex,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	index, err := GetSeasonsIndex(scanner)
	if err != nil {
		t.Fatalf("failed to get pvp seasons index: %v", err)
	}

	if len(index.Seasons) != 16 {
		t.Fatalf("expected 16 seasons, got %d", len(index.Seasons))
	}
}

func TestGetSeasonsIndexFailOnMissingData(t *testing.T) {
	scanner, err := testutils.NewSingleResourceMockScanner(
		"/data/wow/pvp-season/index",
		badIndex,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetSeasonsIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
