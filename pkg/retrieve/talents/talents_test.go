package talents

import (
	_ "embed"
	"fmt"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
)

func TestCanGetTalentTrees(t *testing.T) {
	scanner, err := testutils.NewMockTalentScanner()
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	trees, err := GetTalentTrees(scanner)
	if err != nil {
		t.Fatalf("failed to get talent trees: %v", err)
	}

	if len(trees) != 39 {
		t.Fatalf("expected 39 trees, got %d", len(trees))
	}

	for _, tree := range trees {
		if len(tree.ClassNodes)+len(tree.SpecNodes) < 70 {
			t.Fatalf("expected at least 70 nodes, got %d", len(tree.ClassNodes)+len(tree.SpecNodes))
		}

		if len(tree.HeroTrees) < 2 {
			t.Fatalf("expected at least 2 hero trees, got %d", len(tree.HeroTrees))
		}

		for _, heroTree := range tree.HeroTrees {
			if len(heroTree.Nodes) < 11 {
				t.Errorf("expected at least 11 hero nodes, got %d", len(heroTree.Nodes))
			}
		}

		// None of the pvp talents should match in the mock data so this should be 0.
		// This may be something to change in the future.
		if len(tree.PvpTalents) != 0 {
			t.Fatalf("expected 0 pvp talent nodes, got %d", len(tree.PvpTalents))
		}

		for _, node := range tree.ClassNodes {
			for _, talent := range node.Talents {
				if talent.Icon != fmt.Sprintf("%d", talent.Spell.Id) {
					t.Errorf("expected %d, got %s", talent.Spell.Id, talent.Icon)
				}
			}
		}
		for _, node := range tree.SpecNodes {
			for _, talent := range node.Talents {
				if talent.Icon != fmt.Sprintf("%d", talent.Spell.Id) {
					t.Errorf("expected %d, got %s", talent.Spell.Id, talent.Icon)
				}
			}
		}
		for _, talent := range tree.PvpTalents {
			if talent.Icon != fmt.Sprintf("%d", talent.Spell.Id) {
				t.Errorf("expected %d, got %s", talent.Spell.Id, talent.Icon)
			}
		}

	}
}
