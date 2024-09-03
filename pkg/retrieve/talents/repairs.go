package talents

import "github.com/crbednarz/moonkinmetrics/pkg/repair"

func getTreeRepairs() []repair.Repairer[talentTreeJson] {
	return []repair.Repairer[talentTreeJson]{
		repair.NewRepair(func(treeJson *talentTreeJson) error {
			firstRank := &treeJson.ClassTalentNodes[0].Ranks[0]
			if len(firstRank.ChoiceOfTooltips) == 0 && firstRank.Tooltip == nil {
				treeJson.ClassTalentNodes = treeJson.ClassTalentNodes[1:]
			}
			return nil
		}),
	}
}
