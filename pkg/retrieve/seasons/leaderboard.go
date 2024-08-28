package seasons

import (
	_ "embed"
	"encoding/json"
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
		Rating    int `json:"rating"`
		Character struct {
			Name  string `json:"name"`
			Realm struct {
				Key  keyJson `json:"key"`
				Id   int     `json:"id"`
				Slug string  `json:"slug"`
			}
		} `json:"character"`
	} `json:"entries"`
}

func GetCurrentLeaderboard(scanner *scan.Scanner, bracket string) (wow.Leaderboard, error) {
	seasonId, err := GetCurrentSeasonId(scanner)
	if err != nil {
		return wow.Leaderboard{}, fmt.Errorf("failed to get current season id: %w", err)
	}

	validator, err := validate.NewLegacySchemaValidator(leaderboardSchema)
	if err != nil {
		return wow.Leaderboard{}, fmt.Errorf("failed to setup leaderboard validator: %w", err)
	}
	path := fmt.Sprintf("/data/wow/pvp-season/%d/pvp-leaderboard/%s", seasonId, bracket)
	result := scanner.RefreshSingle(scan.RefreshRequest{
		Lifespan: time.Hour,
		ApiRequest: bnet.Request{
			Region:    bnet.RegionUS,
			Namespace: bnet.NamespaceDynamic,
			Path:      path,
		},
		Validator: validator,
	})

	if result.Error != nil {
		return wow.Leaderboard{}, result.Error
	}

	return parseLeaderboard(result.Body)
}

func parseLeaderboard(data []byte) (wow.Leaderboard, error) {
	leaderboardJson := leaderboardJson{}

	err := json.Unmarshal(data, &leaderboardJson)
	if err != nil {
		return wow.Leaderboard{}, fmt.Errorf("failed to unmarshal leaderboard: %w", err)
	}

	entries := make([]wow.LeaderboardEntry, len(leaderboardJson.Entries))
	for i, entry := range leaderboardJson.Entries {
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
	}, nil
}
