package site

import (
	"fmt"
	"log"
	"strings"

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
	Rating  uint
	Faction string
	Player  wow.PlayerLink
}

type entryGroup struct {
	Tree    *wow.TalentTree
	Entries []EnrichedLeaderboardEntry
}

type bracketMetadata struct {
	Class        string
	Spec         string
	OverrideSpec string
}

var bracketMetadataMap map[string]bracketMetadata = createBracketMetadata()

func createBracketMetadata() map[string]bracketMetadata {
	metadataMap := map[string]bracketMetadata{
		"2v2": {},
		"3v3": {},
		"rbg": {},
	}

	for class, specs := range wow.SpecByClass {
		for _, spec := range specs {
			slug := fmt.Sprintf("shuffle-%s-%s", class, spec)
			slug = strings.ToLower(strings.ReplaceAll(slug, " ", ""))
			metadataMap[slug] = bracketMetadata{
				Class:        class,
				Spec:         spec,
				OverrideSpec: spec,
			}

			slug = fmt.Sprintf("blitz-%s-%s", class, spec)
			slug = strings.ToLower(strings.ReplaceAll(slug, " ", ""))
			metadataMap[slug] = bracketMetadata{
				Class:        class,
				Spec:         spec,
				OverrideSpec: spec,
			}
		}
	}
	return metadataMap
}

func mergeApexTalents(loadout *wow.Loadout, tree *wow.TalentTree) error {
	rank := 0
	specNodes := make([]wow.LoadoutNode, 0, len(loadout.SpecNodes))
	apexIndex := -1
	for i := range loadout.SpecNodes {
		node := &loadout.SpecNodes[i]

		switch node.TalentId {
		case tree.ApexTalents[0].Id:
			apexIndex = len(specNodes)
			rank = max(rank, node.Rank)
		case tree.ApexTalents[1].Id:
			if node.Rank != 0 {
				rank = max(rank, node.Rank+1)
			}
			continue
		case tree.ApexTalents[2].Id:
			if node.Rank != 0 {
				rank = max(rank, node.Rank+3)
			}
			continue
		}
		specNodes = append(specNodes, *node)
	}

	loadout.SpecNodes = specNodes

	if apexIndex == -1 {
		if rank != 0 {
			return fmt.Errorf("missing base apex talent for %s", loadout.Code)
		}
		// Loadout doesn't include apex talent
		return nil
	}

	specNodes[apexIndex].Rank = rank

	return nil
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

	entriesGroups := groupEntriesBySpec(leaderboard.Bracket, entries, trees)

	leaderboards := make([]EnrichedLeaderboard, 0, len(entriesGroups))
	for _, group := range entriesGroups {

		err := applyTalentFixes(group.Entries, group.Tree)
		if err != nil {
			return nil, err
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

// applyTalentFixes attempts to correct known issues with talent reporting.
// For example, apex talents are reported as 3 separate talents which need to
// be merged into one.
func applyTalentFixes(entries []EnrichedLeaderboardEntry, tree *wow.TalentTree) error {
	for i := range entries {
		err := mergeApexTalents(entries[i].Loadout, tree)
		if err != nil {
			return err
		}
	}

	err := fixMissingHeroTreeTalents(entries, tree)
	return err
}

func fixMissingHeroTreeTalents(entries []EnrichedLeaderboardEntry, tree *wow.TalentTree) error {
	roots := make([]*wow.TalentNode, len(tree.HeroTrees))
	nodeIdToTreeIndex := make(map[int]int)
	for treeIndex := range tree.HeroTrees {
		heroTree := &tree.HeroTrees[treeIndex]
		var root *wow.TalentNode
		for i := range heroTree.Nodes {
			node := &heroTree.Nodes[i]
			if len(node.LockedBy) == 0 {
				root = node
			}
		}
		if root == nil {
			return fmt.Errorf("unable to find root node for %s - %s", tree.ClassName, tree.SpecName)
		}

		roots[treeIndex] = root

		for _, node := range heroTree.Nodes {
			if len(node.LockedBy) != 0 {
				nodeIdToTreeIndex[node.Id] = treeIndex
			}
		}
	}

	for entryIndex := range entries {
		entry := &entries[entryIndex]

		heroTreeIndex := -1
		hasRoot := false
		for _, talent := range entry.Loadout.HeroNodes {
			if !hasRoot {
				for _, root := range roots {
					if root.Id == talent.NodeId {
						hasRoot = true
						break
					}
				}
				if hasRoot {
					continue
				}
			}

			treeIndex, ok := nodeIdToTreeIndex[talent.NodeId]
			if ok {
				heroTreeIndex = treeIndex
				break
			}
		}

		if !hasRoot && heroTreeIndex != -1 {
			root := roots[heroTreeIndex]
			entry.Loadout.HeroNodes = append(entry.Loadout.HeroNodes, wow.LoadoutNode{
				TalentName: root.Talents[0].Name,
				TalentId:   root.Talents[0].Id,
				NodeId:     root.Id,
				Rank:       1,
			})
		}
	}
	return nil
}

func groupEntriesBySpec(bracket string, entries []EnrichedLeaderboardEntry, trees []wow.TalentTree) []entryGroup {
	groups := make([]entryGroup, 0, len(trees))
	metadata := bracketMetadataMap[bracket]
	for i := range trees {
		tree := &trees[i]
		if tree.ClassName != metadata.Class && metadata.Class != "" {
			continue
		}
		if tree.SpecName != metadata.Spec && metadata.Spec != "" {
			continue
		}
		group := entryGroup{
			Tree: tree,
		}
		for _, entry := range entries {
			if entry.Loadout.ClassName == tree.ClassName && entry.Loadout.SpecName == tree.SpecName {
				group.Entries = append(group.Entries, entry)
			}
		}
		groups = append(groups, group)
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
		players.WithOverrideSpec(bracketMetadataMap[leaderboard.Bracket].OverrideSpec),
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
