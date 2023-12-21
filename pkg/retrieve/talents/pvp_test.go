package talents

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/talents/testutil"
)

var (
	//go:embed testdata/valid-pvp-talents-index.json
	validPvpTalentIndex string

	//go:embed testdata/valid-pvp-talent.json
	validPvpTalent string
)

func TestGetPvpTalents(t *testing.T) {
	scanner, err := testutil.NewMockScanner(func(requestPath string) (string, bool) {
		if requestPath == "/data/wow/pvp-talent/index" {
			return validPvpTalentIndex, true
		}
		return validPvpTalent, true
	})
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	talents, err := GetPvpTalents(scanner)
	if err != nil {
		t.Fatalf("failed to get pvp talents: %v", err)
	}

	if len(talents) != 436 {
		t.Fatalf("expected 436 talents, got %d", len(talents))
	}
}
