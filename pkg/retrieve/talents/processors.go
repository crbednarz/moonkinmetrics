package talents

import (
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
)

func getTreeRepairs() []scan.ResultProcessor[talentTreeJson] {
	return []scan.ResultProcessor[talentTreeJson]{
		scan.NewResultProcessor(func(treeJson *talentTreeJson) error {
			treeJson.ClassTalentNodes = removeNoDescriptionTalents(treeJson.ClassTalentNodes)
			treeJson.SpecTalentNodes = removeNoDescriptionTalents(treeJson.SpecTalentNodes)
			return nil
		}),
	}
}

func getTreeFilters() []scan.ResultProcessor[talentTreeJson] {
	return []scan.ResultProcessor[talentTreeJson]{
		scan.NewResultProcessor(func(treeJson *talentTreeJson) error {
			treeJson.ClassTalentNodes = removeHeroTalents(treeJson.ClassTalentNodes, treeJson)
			treeJson.SpecTalentNodes = removeHeroTalents(treeJson.SpecTalentNodes, treeJson)
			return nil
		}),
	}
}

func removeHeroTalents(talentNodes []talentNodeJson, tree *talentTreeJson) []talentNodeJson {
	heroNodeIds := make(map[int]bool)
	for heroTreeIndex := range tree.HeroTalentTrees {
		heroTree := tree.HeroTalentTrees[heroTreeIndex]
		for _, node := range heroTree.TalentNodes {
			heroNodeIds[node.Id] = true
		}
	}

	filteredNodes := make([]talentNodeJson, 0, len(talentNodes))
	for i := range talentNodes {
		if _, ok := heroNodeIds[talentNodes[i].Id]; !ok {
			filteredNodes = append(filteredNodes, talentNodes[i])
		}
	}

	return filteredNodes
}

func removeNoDescriptionTalents(talentNodes []talentNodeJson) []talentNodeJson {
	results := make([]talentNodeJson, 0, len(talentNodes))

	for _, node := range talentNodes {
		if len(node.Ranks) == 0 {
			continue
		}
		firstRank := &node.Ranks[0]
		if len(firstRank.ChoiceOfTooltips) > 0 || firstRank.Tooltip != nil {
			results = append(results, node)
		}
	}

	return results
}