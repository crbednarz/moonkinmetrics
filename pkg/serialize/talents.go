package serialize

import (
	"encoding/json"

	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type talentTreeJson struct {
	ClassName  string           `json:"class_name"`
	SpecName   string           `json:"spec_name"`
	ClassId    int              `json:"class_id"`
	SpecId     int              `json:"spec_id"`
	ClassNodes []talentNodeJson `json:"class_nodes"`
	SpecNodes  []talentNodeJson `json:"spec_nodes"`
	PvpTalents []talentJson     `json:"pvp_talents"`
}

type talentNodeJson struct {
	Id       int          `json:"id"`
	X        int          `json:"x"`
	Y        int          `json:"y"`
	Row      int          `json:"row"`
	Col      int          `json:"col"`
	Unlocks  []int        `json:"unlocks"`
	LockedBy []int        `json:"locked_by"`
	Talents  []talentJson `json:"talents"`
	MaxRank  int          `json:"max_rank"`
	NodeType string       `json:"node_type"`
}

type talentJson struct {
	Id    int       `json:"id"`
	Name  string    `json:"name"`
	Icon  string    `json:"icon"`
	Spell spellJson `json:"spell"`
}

type spellJson struct {
	Id    int        `json:"id"`
	Name  string     `json:"name"`
	Ranks []rankJson `json:"ranks"`
}

type rankJson struct {
	Description string `json:"description"`
	CastTime    string `json:"cast_time"`
	PowerCost   string `json:"power_cost"`
	Range       string `json:"range"`
	Cooldown    string `json:"cooldown"`
}

func ExportTalentsToJson(talents *wow.TalentTree) ([]byte, error) {
	classNodes, err := convertNodes(talents.ClassNodes)
	if err != nil {
		return nil, err
	}

	specNodes, err := convertNodes(talents.SpecNodes)
	if err != nil {
		return nil, err
	}

	pvpTalents, err := convertTalents(talents.PvpTalents)
	if err != nil {
		return nil, err
	}

	tree := talentTreeJson{
		ClassName:  talents.ClassName,
		SpecName:   talents.SpecName,
		ClassId:    talents.ClassId,
		SpecId:     talents.SpecId,
		ClassNodes: classNodes,
		SpecNodes:  specNodes,
		PvpTalents: pvpTalents,
	}
	return json.MarshalIndent(tree, "", "  ")
}

func convertNodes(nodes []wow.TalentNode) ([]talentNodeJson, error) {
	jsonNodes := make([]talentNodeJson, len(nodes))
	for i, node := range nodes {
		talents, err := convertTalents(node.Talents)
		if err != nil {
			return nil, err
		}
		jsonNodes[i] = talentNodeJson{
			Id:       node.Id,
			X:        node.X,
			Y:        node.Y,
			Row:      node.Row,
			Col:      node.Col,
			LockedBy: node.LockedBy,
			Unlocks:  node.Unlocks,
			MaxRank:  node.MaxRank,
			NodeType: node.NodeType,
			Talents:  talents,
		}
	}
	return jsonNodes, nil
}

func convertTalents(talents []wow.Talent) ([]talentJson, error) {
	jsonTalents := make([]talentJson, len(talents))
	for i, talent := range talents {
		jsonTalents[i] = talentJson{
			Id:   talent.Id,
			Name: talent.Name,
			Icon: talent.Icon,
			Spell: spellJson{
				Id:    talent.Spell.Id,
				Name:  talent.Spell.Name,
				Ranks: convertRanks(talent.Spell.Ranks),
			},
		}
	}
	return jsonTalents, nil
}

func convertRanks(ranks []wow.Rank) []rankJson {
	jsonRanks := make([]rankJson, len(ranks))
	for i, rank := range ranks {
		jsonRanks[i] = rankJson{
			Description: rank.Description,
			CastTime:    rank.CastTime,
			PowerCost:   rank.PowerCost,
			Range:       rank.Range,
			Cooldown:    rank.Cooldown,
		}
	}
	return jsonRanks
}
