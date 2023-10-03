package talents

import (
	_ "embed"
	"testing"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
)

var (
	//go:embed testdata/valid-tree.json
	validTree string
)

func TestGetTalentTree(t *testing.T) {
	scanner, err := newMockScanner(validTree)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	response := scanner.RefreshSingle(scan.RefreshRequest{
		Lifespan: time.Hour * 24,
		ApiRequest: bnet.Request{
			Namespace: bnet.NamespaceStatic,
			Region:    bnet.RegionUS,
			Path:      "/data/wow/talent-tree/786/playable-specialization/262",
		},
		Validator: nil,
	})

	if response.Error != nil {
		t.Fatalf("failed to get talent tree: %v", response.Error)
	}

	tree, err := parseTalentTreeJson(response.Body)
	if err != nil {
		t.Fatalf("failed to parse talent tree json: %v", err)
	}

	if tree.SpecName != "Elemental" || tree.ClassName != "Shaman" {
		t.Errorf("expected spec name to be Elemental and class name to be Shaman, got %s and %s", tree.SpecName, tree.ClassName)
	}

	if tree.SpecId != 262 || tree.ClassId != 786 {
		t.Errorf("expected spec id to be 262 and class id to be 786, got %d and %d", tree.SpecId, tree.ClassId)
	}

	if len(tree.ClassNodes) != 48 {
		t.Errorf("expected 48 class nodes, got %d", len(tree.ClassNodes))
	}

	if len(tree.SpecNodes) != 40 {
		t.Errorf("expected 40 spec nodes, got %d", len(tree.SpecNodes))
	}

	if len(tree.PvpTalents) != 0 {
		// PvP talents are not populated as part of the initial parse.
		t.Errorf("expected 0 pvp talents, got %d", len(tree.PvpTalents))
	}
}
