package talents

import (
	_ "embed"
	"testing"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

//go:embed testdata/valid-tree.json
var validTree string

func TestGetTalentTree(t *testing.T) {
	path := "/data/wow/talent-tree/786/playable-specialization/262"
	scanner, err := testutils.NewSingleResourceMockScanner(path, validTree)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	validator, err := validate.NewSchemaValidator[talentTreeJson](talentTreeSchema)
	if err != nil {
		t.Fatalf("failed to setup talent tree validator: %v", err)
	}

	response := scan.ScanSingle(
		scanner,
		bnet.Request{
			Namespace: bnet.NamespaceStatic,
			Region:    bnet.RegionUS,
			Path:      path,
		},
		&scan.ScanOptions[talentTreeJson]{
			Lifespan:  time.Hour * 24,
			Repairs:   getTreeRepairs(),
			Filters:   getTreeFilters(),
			Validator: validator,
		},
	)

	if response.Error != nil {
		t.Fatalf("failed to get talent tree: %v", response.Error)
	}

	tree, err := parseTalentTreeJson(&response.Response)
	if err != nil {
		t.Fatalf("failed to parse talent tree json: %v", err)
	}

	if tree.SpecName != "Elemental" || tree.ClassName != "Shaman" {
		t.Errorf("expected spec name to be Elemental and class name to be Shaman, got %s and %s", tree.SpecName, tree.ClassName)
	}

	if tree.SpecId != 262 || tree.ClassId != 786 {
		t.Errorf("expected spec id to be 262 and class id to be 786, got %d and %d", tree.SpecId, tree.ClassId)
	}

	if len(tree.ClassNodes) != 51 {
		t.Errorf("expected 51 class nodes, got %d", len(tree.ClassNodes))
	}

	if len(tree.SpecNodes) != 43 {
		t.Errorf("expected 43 spec nodes, got %d", len(tree.SpecNodes))
	}

	if len(tree.HeroTrees) != 3 {
		t.Fatalf("expected 3 hero trees, got %d", len(tree.HeroTrees))
	}

	for _, heroTree := range tree.HeroTrees {
		if len(heroTree.Nodes) != 11 {
			t.Errorf("expected 11 hero nodes, got %d", len(heroTree.Nodes))
		}
	}

	if len(tree.PvpTalents) != 0 {
		// PvP talents are not populated as part of the initial parse.
		t.Errorf("expected 0 pvp talents, got %d", len(tree.PvpTalents))
	}
}
