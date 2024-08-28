package players

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/testutil"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed testdata/valid-player.json
var validPlayer string

func TestGetSingeLoadout(t *testing.T) {
	scanner, err := testutil.NewSingleResourceMockScanner(
		"/profile/wow/character/windrunner/chutney/specializations",
		validPlayer,
	)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	playerLink := wow.PlayerLink{
		Name: "chutney",
		Realm: wow.RealmLink{
			Slug: "windrunner",
			Url:  "",
		},
	}
	responses, err := GetPlayerLoadouts(
		scanner,
		[]wow.PlayerLink{playerLink},
		LoadoutScanOptions{},
	)
	if err != nil {
		t.Fatalf("failed to load player loadout: %v", err)
	}

	if len(responses) != 1 {
		t.Fatalf("expected 1 response, got %d", len(responses))
	}

	if responses[0].Error != nil {
		t.Fatalf("expected no error, got %v", responses[0].Error)
	}

	if responses[0].Loadout.SpecName != "Restoration" {
		t.Fatalf("expected spec name 'Restoration', got %s", responses[0].Loadout.SpecName)
	}

	if responses[0].Loadout.ClassName != "Druid" {
		t.Fatalf("expected class name 'Druid', got %s", responses[0].Loadout.ClassName)
	}

	if len(responses[0].Loadout.ClassNodes) != 25 {
		t.Errorf("expected 25 class nodes, got %d", len(responses[0].Loadout.ClassNodes))
	}

	if len(responses[0].Loadout.SpecNodes) != 27 {
		t.Errorf("expected 27 spec nodes, got %d", len(responses[0].Loadout.SpecNodes))
	}

	if len(responses[0].Loadout.PvpTalents) != 3 {
		t.Errorf("expected 3 pvp talents, got %d", len(responses[0].Loadout.PvpTalents))
	}
}
