package serialize

import (
	"encoding/base64"
	"encoding/json"
	"slices"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/site"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

const EncodingVersion int = 1

type classSpec struct {
	ClassName string
	SpecName  string
}

type leaderboardJson struct {
	Entries  []string     `json:"entries"`
	Encoding metadataJson `json:"encoding"`
}

type metadataJson struct {
	Realms  []realmJson `json:"realms"`
	Version int         `json:"version"`
}

type realmJson struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
}

func ExportLeaderboardToJson(leaderboard *site.EnrichedLeaderboard) ([]byte, error) {
	realms := make([]realmJson, 0, len(leaderboard.RealmMap))
	for slug, realm := range leaderboard.RealmMap {
		realms = append(realms, realmJson{slug, realm.Name})
	}

	talentMap := createTalentMap(leaderboard.Tree)
	pvpTalentMap := createPvpTalentMap(leaderboard.Tree)
	multiRankMap := createMultiRankMap(leaderboard.Tree)
	realmMap := createRealmMap(realms)

	entries := make([]string, 0, len(leaderboard.Entries))
	for _, entry := range leaderboard.Entries {
		data := make([]byte, 0, 128)

		talentCount := 0
		data = append(data, byte(0))
		for _, node := range entry.Loadout.ClassNodes {
			talentIndex, ok := talentMap[node.TalentId]
			if !ok {
				continue
			}
			talentCount++
			data = append(data, byte(talentIndex))
			if multiRankMap[node.TalentId] {
				data = append(data, byte(node.Rank))
			}
		}
		for _, node := range entry.Loadout.SpecNodes {
			talentIndex, ok := talentMap[node.TalentId]
			if !ok {
				continue
			}
			talentCount++
			data = append(data, byte(talentIndex))
			if multiRankMap[node.TalentId] {
				data = append(data, byte(node.Rank))
			}
		}
		data[0] = byte(talentCount)

		data = append(data, byte(len(entry.Loadout.PvpTalents)))
		for _, talent := range entry.Loadout.PvpTalents {
			data = append(data, byte(pvpTalentMap[talent.Id]))
		}

		rating := entry.Rating
		data = append(data, byte(rating&0xFF))
		data = append(data, byte((rating>>8)&0xFF))

		realmIndex := realmMap[entry.Player.Realm.Slug]
		data = append(data, byte(realmIndex&0xFF))
		data = append(data, byte((realmIndex>>8)&0xFF))

		if entry.Faction == "HORDE" {
			data = append(data, 1)
		} else {
			data = append(data, 0)
		}

		encodedData := base64.StdEncoding.EncodeToString(data)
		entryData := strings.Join([]string{encodedData, entry.Player.Name, entry.Loadout.Code}, "|")
		entries = append(entries, entryData)
	}

	output := leaderboardJson{
		Encoding: metadataJson{
			Version: EncodingVersion,
			Realms:  realms,
		},
		Entries: entries,
	}

	return json.MarshalIndent(output, "", "  ")
}

func createTalentMap(tree *wow.TalentTree) map[int]int {
	talentIds := make([]int, 0, len(tree.ClassNodes)+len(tree.SpecNodes))
	idsSeen := make(map[int]bool, len(tree.ClassNodes)+len(tree.SpecNodes))
	for _, node := range tree.ClassNodes {
		for _, talent := range node.Talents {
			if _, ok := idsSeen[talent.Id]; !ok {
				talentIds = append(talentIds, talent.Id)
				idsSeen[talent.Id] = true
			}
		}
	}
	for _, node := range tree.SpecNodes {
		for _, talent := range node.Talents {
			if _, ok := idsSeen[talent.Id]; !ok {
				talentIds = append(talentIds, talent.Id)
				idsSeen[talent.Id] = true
			}
		}
	}
	talentMap := make(map[int]int, len(talentIds))
	slices.Sort(talentIds)
	for i, id := range talentIds {
		talentMap[id] = i
	}
	return talentMap
}

func createPvpTalentMap(tree *wow.TalentTree) map[int]int {
	talentIds := make([]int, 0, len(tree.PvpTalents))
	for _, talent := range tree.PvpTalents {
		talentIds = append(talentIds, talent.Id)
	}
	talentMap := make(map[int]int, len(talentIds))
	slices.Sort(talentIds)
	for i, id := range talentIds {
		talentMap[id] = i
	}
	return talentMap
}

func createMultiRankMap(tree *wow.TalentTree) map[int]bool {
	rankMap := make(map[int]bool, len(tree.ClassNodes)+len(tree.SpecNodes))
	for _, node := range tree.ClassNodes {
		for _, talent := range node.Talents {
			rankMap[talent.Id] = node.MaxRank > 1
		}
	}
	for _, node := range tree.SpecNodes {
		for _, talent := range node.Talents {
			rankMap[talent.Id] = node.MaxRank > 1
		}
	}
	return rankMap
}

func createRealmMap(realms []realmJson) map[string]int {
	realmMap := make(map[string]int, len(realms))
	for i, realm := range realms {
		realmMap[realm.Slug] = i
	}
	return realmMap
}
