package seasons

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
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
		Rating uint `json:"rating"`
	} `json:"entries"`
}

func GetCurrentLeaderboard(scanner *scan.Scanner, bracket string, region api.Region) (wow.Leaderboard, error) {
	seasonId, err := GetCurrentSeasonId(scanner, region)
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
		api.BnetRequest{
			Region:    region,
			Namespace: api.NamespaceDynamic,
			Path:      path,
		},
		&scan.ScanOptions[leaderboardJson]{
			Validator: validator,
			Lifespan:  time.Hour * 18,
		},
	)

	if result.Error != nil {
		return wow.Leaderboard{}, result.Error
	}

	return wow.Leaderboard{
		Entries: parseLeaderboardEntries(&result.Response),
		Bracket: bracket,
		Region:  region,
	}, nil
}

func parseLeaderboardEntries(inputJson *leaderboardJson) []wow.LeaderboardEntry {
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

	return entries
}
