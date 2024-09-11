package seasons

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed schema/leaderboard.schema.json
var leaderboardSchema string

type leaderboardJson struct {
	Entries []struct {
		Faction struct {
			Type string `json:"type"`
		} `json:"faction"`
		Character struct {
			Name  string `json:"name"`
			Realm struct {
				Key  keyJson `json:"key"`
				Slug string  `json:"slug"`
				Id   int     `json:"id"`
			} `json:"realm"`
		} `json:"character"`
		Rating int `json:"rating"`
	} `json:"entries"`
}

func GetCurrentLeaderboard(scanner *scan.Scanner, bracket string) (wow.Leaderboard, error) {
	seasonId, err := GetCurrentSeasonId(scanner)
	if err != nil {
		return wow.Leaderboard{}, fmt.Errorf("failed to get current season id: %w", err)
	}

	validator, err := validate.NewSchemaValidator[leaderboardJson](leaderboardSchema)
	if err != nil {
		return wow.Leaderboard{}, fmt.Errorf("failed to setup leaderboard validator: %w", err)
	}
	path := fmt.Sprintf("/data/wow/pvp-season/%d/pvp-leaderboard/%s", seasonId, bracket)
	result := scan.ScanSingle(
		scanner,
		bnet.Request{
			Region:    bnet.RegionUS,
			Namespace: bnet.NamespaceDynamic,
			Path:      path,
		},
		&scan.ScanOptions[leaderboardJson]{
			Validator: validator,
			Lifespan:  time.Hour,
		},
	)

	if result.Error != nil {
		return wow.Leaderboard{}, result.Error
	}

	return parseLeaderboard(&result.Response), nil
}

func parseLeaderboard(inputJson *leaderboardJson) wow.Leaderboard {
	entries := make([]wow.LeaderboardEntry, len(inputJson.Entries))
	for i, entry := range inputJson.Entries {
		entries[i] = wow.LeaderboardEntry{
			Player: wow.PlayerLink{
				Name: entry.Character.Name,
				Realm: wow.RealmLink{
					Slug: entry.Character.Realm.Slug,
					Url:  entry.Character.Realm.Key.Href,
				},
			},
			Faction: entry.Faction.Type,
			Rating:  entry.Rating,
		}
	}

	return wow.Leaderboard{
		Entries: entries,
	}
}
