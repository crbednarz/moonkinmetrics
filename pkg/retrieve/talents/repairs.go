package talents

import "github.com/crbednarz/moonkinmetrics/pkg/repair"

func getTreeRepairs() []repair.Repairer[talentTreeJson] {
	return []repair.Repairer[talentTreeJson]{
		repair.NewRepair(func(treeJson *talentTreeJson) error {
			treeJson.ClassTalentNodes = removeNoDescriptionTalents(treeJson.ClassTalentNodes)
			treeJson.SpecTalentNodes = removeNoDescriptionTalents(treeJson.SpecTalentNodes)
			return nil
		}),
	}
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
