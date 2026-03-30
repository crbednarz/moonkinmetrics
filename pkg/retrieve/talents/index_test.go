package talents

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
)

var (
	//go:embed testdata/valid-tree-index.json
	validTreeIndex string

	//go:embed testdata/bad-link-tree-index.json
	badLinkTreeIndex string

	//go:embed testdata/missing-data-tree-index.json
	missingDataTreeIndex string
)

func TestGetTalentTreeIndex(t *testing.T) {
	scanner, err := testutils.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		validTreeIndex,
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
	scanner, err := testutils.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		missingDataTreeIndex,
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
	scanner, err := testutils.NewSingleResourceMockScanner(
		"/data/wow/talent-tree/index",
		badLinkTreeIndex,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetTalentTreeIndex(scanner)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
