package talents

import (
	"fmt"

	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

// attachApexTalents constructs ApexTalents field on provied trees:
// tree.ApexTalents = {Rank1Talent, Rank2And3Talent, Rank4Talent}
// Additionally, these talents are merged into a single 4-rank talent
// for the spec tree.
func attachApexTalents(scanner *scan.Scanner, trees []wow.TalentTree) error {
	// On the API, Apex talents are split into three:
	// 1. The first rank of the talent (present in spec tree and talents index)
	// 2. Ranks 2&3 of the apex talent as a single 2-rank talent (only present under talents index)
	// 3. Rank 4 of the apex talent (only present under talents index)

	talentsIndex, err := GetTalentsIndex(scanner)
	if err != nil {
		return fmt.Errorf("apex talent correction failed during talents index construction: %w", err)
	}

	// Search talents index for anything matching the name of an existing apex talent
	baseApexNodes := make([]*wow.TalentNode, len(trees))
	apexNameMap := make(map[string]bool)
	for i := range trees {
		tree := &trees[i]
		apex := findApexNodeFromTree(tree)
		if apex == nil {
			return fmt.Errorf("can't find apex talent for %s - %s", tree.ClassName, tree.SpecName)
		}

		tree.ApexTalents = make([]wow.Talent, 3)
		tree.ApexTalents[0] = apex.Talents[0]
		apexNameMap[apex.Talents[0].Name] = true
		baseApexNodes[i] = apex
	}

	possibleApexTalentIds := make([]int, 0, len(trees)*3)
	for _, item := range talentsIndex.Talents {
		_, ok := apexNameMap[item.Name]
		if ok {
			possibleApexTalentIds = append(possibleApexTalentIds, item.Id)
		}
	}
	possibleApexTalents, err := getTalentsJsonFromIds(scanner, possibleApexTalentIds)
	if err != nil {
		return fmt.Errorf("failed to query potential apex talents: %w", err)
	}

	for i := range trees {
		tree := &trees[i]
		apexNode := baseApexNodes[i]
		baseRank := apexNode.Talents[0].Spell.Ranks[0]
		apexNode.MaxRank = 4
		ranks := []wow.Rank{
			baseRank,
			baseRank,
			baseRank,
			baseRank,
		}
		apexNode.Talents[0].Spell.Ranks = ranks

		for _, talent := range possibleApexTalents {
			if talent.Spell.Name != apexNode.Talents[0].Name {
				continue
			}
			if talent.Id == apexNode.Id {
				continue
			}

			if len(talent.RankDescriptions) == 2 {
				tree.ApexTalents[1] = parseTalentJson(talent)
				ranks[1].Description = talent.RankDescriptions[0].Description
				ranks[2].Description = talent.RankDescriptions[1].Description
			} else {
				tree.ApexTalents[2] = parseTalentJson(talent)
				ranks[3].Description = talent.RankDescriptions[0].Description
			}
		}
	}

	return nil
}

func findApexNodeFromTree(tree *wow.TalentTree) *wow.TalentNode {
	// Annoyingly, I don't see any other way to identify an apex talent without
	// hardcoding the names.
	lowestNode := &tree.SpecNodes[0]

	for i := range tree.SpecNodes {
		node := &tree.SpecNodes[i]
		if node.Y > lowestNode.Y {
			lowestNode = node
		}
	}
	return lowestNode
}
