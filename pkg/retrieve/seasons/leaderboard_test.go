package seasons

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
)

var (
	//go:embed testdata/valid-leaderboard.json
	validLeaderboard string

	//go:embed testdata/bad-leaderboard.json
	badLeaderboard string
)

func newLeaderboardMockScanner(body string) (*scan.Scanner, error) {
	return testutils.NewMockScanner(
		func(requestPath string) (string, bool) {
			if requestPath == "/data/wow/pvp-season/index" {
				return validIndex, true
			}
			return body, requestPath == "/data/wow/pvp-season/37/pvp-leaderboard/3v3"
		},
	)
}

func TestGetCurrentLeaderboard(t *testing.T) {
	scanner, err := newLeaderboardMockScanner(validLeaderboard)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	leaderboard, err := GetCurrentLeaderboard(scanner, "3v3", bnet.RegionUS)
	if err != nil {
		t.Fatalf("failed to get leaderboard: %v", err)
	}

	if len(leaderboard.Entries) != 5009 {
		t.Fatalf("expected 5009 entries, got %d", len(leaderboard.Entries))
	}
}

func TestGetCurrentLeaderboardFailsOnBadData(t *testing.T) {
	scanner, err := newLeaderboardMockScanner(badLeaderboard)
	if err != nil {
		t.Fatalf("failed to setup scanner: %v", err)
	}

	_, err = GetCurrentLeaderboard(scanner, "3v3", bnet.RegionUS)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
