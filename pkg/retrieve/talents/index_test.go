package talents

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents/testutil"
)

var (
	//go:embed testdata/valid-index.json
	validIndex string

	//go:embed testdata/bad-link-index.json
	badLinkIndex string

	//go:embed testdata/missing-data-index.json
	missingDataIndex string
)

func TestGetTalentTreeIndex(t *testing.T) {
	scanner, err := testutil.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		validIndex,
	)
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
	scanner, err := testutil.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		missingDataIndex,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetTalentTreeIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestTalentTreeIndexBadLinkFails(t *testing.T) {
	scanner, err := testutil.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		badLinkIndex,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetTalentTreeIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
