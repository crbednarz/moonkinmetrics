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

	if len(trees) != 40 {
		t.Fatalf("expected 40 trees, got %d", len(trees))
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

		// Due to the mocking mechanism, all talents will fall into exactly one spec.
		if len(tree.PvpTalents) != 0 && len(tree.PvpTalents) != 408 {
			t.Fatalf("expected 0 or 408 pvp talent nodes, got %d", len(tree.PvpTalents))
		}

		if len(tree.ApexTalents) != 3 {
			t.Fatalf("expected 3 apex talents per tree, got %d", len(tree.ApexTalents))
		}

		apexNode := findApexNodeFromTree(&tree)
		if apexNode.MaxRank != 4 {
			t.Fatalf("expected max apex talent rank to be 4, got %d", apexNode.MaxRank)
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
