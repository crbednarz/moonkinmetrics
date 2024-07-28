package talents

import (
	_ "embed"
	"fmt"
	"strings"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/hack"
	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/testutil"
)

//go:embed testdata/valid-talent.json
var validTalent string

func TestParseIngameTalentTree(t *testing.T) {
	scanner, err := testutil.NewMockScanner(func(requestPath string) (string, bool) {
		if strings.HasPrefix(requestPath, "/data/wow/talent/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/talent/")
			return strings.ReplaceAll(validTalent, "108105", id), true
		}
		return "", false
	})
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	ingameTrees := hack.GetIngameTrees()

	for _, ingameTree := range ingameTrees {
		name := fmt.Sprintf("%s %s", ingameTree.ClassName, ingameTree.SpecName)
		t.Run(name, func(t *testing.T) {
			tree, err := talentTreeFromIngame(scanner, ingameTree)
			if err != nil {
				t.Fatalf("failed to parse talent tree: %v", err)
			}

			if tree.ClassName != ingameTree.ClassName {
				t.Errorf("expected class name %s, got %s", ingameTree.ClassName, tree.ClassName)
			}

			if tree.SpecName != ingameTree.SpecName {
				t.Errorf("expected spec name %s, got %s", ingameTree.SpecName, tree.SpecName)
			}

			if tree.SpecId != ingameTree.SpecId {
				t.Errorf("expected spec id %d, got %d", ingameTree.SpecId, tree.SpecId)
			}

			if tree.ClassId != ingameTree.ClassId {
				t.Errorf("expected class id %d, got %d", ingameTree.ClassId, tree.ClassId)
			}

			if len(tree.PvpTalents) != 0 {
				t.Errorf("expected pvp talents 0, got %d", len(tree.PvpTalents))
			}

			if len(tree.ClassNodes)+len(tree.SpecNodes) != len(ingameTree.Nodes) {
				t.Errorf("expected %d nodes, got %d", len(ingameTree.Nodes), len(tree.ClassNodes)+len(tree.SpecNodes))
			}
		})
	}
}
