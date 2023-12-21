package talents

import (
	_ "embed"
	"strings"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents/testutil"
)

func TestCanGetTalentTrees(t *testing.T) {
	scanner, err := testutil.NewMockScanner(func(requestPath string) (string, bool) {
		if requestPath == "/data/wow/talent-tree/index" {
			return validIndex, true
		}
		if strings.HasPrefix(requestPath, "/data/wow/talent-tree/") {
			return validTree, true
		}
		if strings.HasPrefix(requestPath, "/data/wow/talent/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/talent/")
			return strings.ReplaceAll(validTalent, "108105", id), true
		}
		if requestPath == "/data/wow/pvp-talent/index" {
			return validPvpTalentIndex, true
		}
		if strings.HasPrefix(requestPath, "/data/wow/pvp-talent/") {
			return validPvpTalent, true
		}
		return "", false
	})

	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	trees, err := GetTalentTrees(scanner)
	if err != nil {
		t.Fatalf("failed to get talent trees: %v", err)
	}

	if len(trees) != 42 {
		t.Fatalf("expected 42 trees, got %d", len(trees))
	}

	for _, tree := range trees {
		if len(tree.ClassNodes) + len(tree.SpecNodes) < 70 {
			t.Fatalf("expected at least 70 nodes, got %d", len(tree.ClassNodes) + len(tree.SpecNodes))
		}
		// None of the pvp talents should match in the mock data so this should be 0.
		// This may be something to change in the future.
		if len(tree.PvpTalents) != 0 {
			t.Fatalf("expected 0 pvp talent nodes, got %d", len(tree.PvpTalents))
		}
	}
}
