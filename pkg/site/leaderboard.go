package site

import (
	"log"

	"github.com/crbednarz/moonkinmetrics/pkg/retrieve/players"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type EnrichedLeaderboard struct {
	RealmMap  map[string]wow.Realm
	Entries   []EnrichedLeaderboardEntry
	ClassName string
	SpecName  string
	Bracket   string
	Tree      *wow.TalentTree
}

type EnrichedLeaderboardEntry struct {
	Loadout *wow.Loadout
	Rating  int
	Faction string
	Player  wow.PlayerLink
}

type entryGroup struct {
	Tree    *wow.TalentTree
	Entries []EnrichedLeaderboardEntry
}

func EnrichLeaderboard(scanner *scan.Scanner, leaderboard *wow.Leaderboard, trees []wow.TalentTree) ([]EnrichedLeaderboard, error) {
	loadouts, err := getLoadouts(scanner, leaderboard)
	if err != nil {
		return nil, err
	}

	entries := make([]EnrichedLeaderboardEntry, 0, len(leaderboard.Entries))
	for i := range leaderboard.Entries {
		entry := &leaderboard.Entries[i]
		loadout := loadouts[i]
		if loadout.Error != nil {
			continue
		}
		entries = append(entries, EnrichedLeaderboardEntry{
			Player:  entry.Player,
			Rating:  entry.Rating,
			Faction: entry.Faction,
			Loadout: &loadout.Loadout,
		})
	}

	realmMap, err := getRealmMap(scanner, leaderboard)
	if err != nil {
		return nil, err
	}

	entriesGroups := groupEntriesBySpec(entries, trees)

	leaderboards := make([]EnrichedLeaderboard, 0, len(entriesGroups))
	for _, group := range entriesGroups {
		if len(group.Entries) == 0 {
			continue
		}
		leaderboard := EnrichedLeaderboard{
			RealmMap:  filteredRealmMap(realmMap, group.Entries),
			Entries:   group.Entries,
			ClassName: group.Tree.ClassName,
			SpecName:  group.Tree.SpecName,
			Bracket:   leaderboard.Bracket,
			Tree:      group.Tree,
		}
		leaderboards = append(leaderboards, leaderboard)
		log.Printf(
			"Eriched leaderboard [Class: %s, Spec: %s, Bracket: %s]",
			leaderboard.ClassName,
			leaderboard.SpecName,
			leaderboard.Bracket,
		)
	}

	return leaderboards, nil
}

func groupEntriesBySpec(entries []EnrichedLeaderboardEntry, trees []wow.TalentTree) []entryGroup {
	groups := make([]entryGroup, 0, len(trees))
	for i := range trees {
		tree := &trees[i]
		group := entryGroup{
			Tree: tree,
		}
		for _, entry := range entries {
			if entry.Loadout.ClassName == tree.ClassName && entry.Loadout.SpecName == tree.SpecName {
				group.Entries = append(group.Entries, entry)
			}
		}
		if len(group.Entries) != 0 {
			groups = append(groups, group)
		}
	}
	return groups
}

func getLoadouts(scanner *scan.Scanner, leaderboard *wow.Leaderboard) ([]players.LoadoutResponse, error) {
	playerLinks := make([]wow.PlayerLink, len(leaderboard.Entries))
	for i, entry := range leaderboard.Entries {
		playerLinks[i] = entry.Player
	}
	loadouts, err := players.GetPlayerLoadouts(
		scanner,
		playerLinks,
		players.WithRegion(leaderboard.Region),
	)
	if err != nil {
		return nil, err
	}
	return loadouts, nil
}

func filteredRealmMap(realmMap map[string]wow.Realm, entries []EnrichedLeaderboardEntry) map[string]wow.Realm {
	filteredRealmMap := make(map[string]wow.Realm, len(realmMap))
	for _, entry := range entries {
		realm := realmMap[entry.Player.Realm.Slug]
		filteredRealmMap[realm.Slug] = realm
	}
	return filteredRealmMap
}

func getRealmMap(scanner *scan.Scanner, leaderboard *wow.Leaderboard) (map[string]wow.Realm, error) {
	realmLinks := leaderboard.GetUniqueRealms()
	realms, err := players.GetRealms(scanner, realmLinks)
	if err != nil {
		return nil, err
	}

	realmMap := make(map[string]wow.Realm, len(realms))
	for _, realm := range realms {
		realmMap[realm.Slug] = realm
	}
	return realmMap, nil
}

func (l *EnrichedLeaderboard) SplitBySpec() []wow.Realm {
	realms := make([]wow.Realm, 0, len(l.RealmMap))
	for _, realm := range l.RealmMap {
		realms = append(realms, realm)
	}
	return realms
}
