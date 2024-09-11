package talents

import (
	"errors"

	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

var errKnownBadNode = errors.New("talent node is known to be bad")

type talentTreeJson struct {
	Id            int `json:"id"`
	PlayableClass struct {
		Id   int    `json:"id"`
		Name string `json:"name"`
	} `json:"playable_class"`
	PlayableSpecialization struct {
		Id   int    `json:"id"`
		Name string `json:"name"`
	} `json:"playable_specialization"`
	ClassTalentNodes []talentNodeJson `json:"class_talent_nodes"`
	SpecTalentNodes  []talentNodeJson `json:"spec_talent_nodes"`
	HeroTalentTrees  []heroTreeJson   `json:"hero_talent_trees"`
}

type heroTreeJson struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Media struct {
		Id  int     `json:"id"`
		Key keyJson `json:"key"`
	} `json:"media"`
	TalentNodes []talentNodeJson `json:"hero_talent_nodes"`
}

type talentNodeJson struct {
	Id       int   `json:"id"`
	Unlocks  []int `json:"unlocks"`
	LockedBy []int `json:"locked_by"`
	NodeType struct {
		Type string `json:"type"`
		Id   int    `json:"id"`
	} `json:"node_type"`
	Ranks        []rankJson `json:"ranks"`
	DisplayRow   int        `json:"display_row"`
	DisplayCol   int        `json:"display_col"`
	RawPositionX int        `json:"raw_position_x"`
	RawPositionY int        `json:"raw_position_y"`
}

type rankJson struct {
	Rank             int           `json:"rank"`
	Tooltip          *tooltipJson  `json:"tooltip,omitempty"`
	ChoiceOfTooltips []tooltipJson `json:"choice_of_tooltips,omitempty"`
}

type tooltipJson struct {
	Talent struct {
		Key  keyJson `json:"key"`
		Name string  `json:"name"`
		Id   int     `json:"id"`
	} `json:"talent"`
	SpellTooltip spellTooltipJson `json:"spell_tooltip"`
}

type spellTooltipJson struct {
	Spell struct {
		Key  keyJson `json:"key"`
		Name string  `json:"name"`
		Id   int     `json:"id"`
	} `json:"spell"`
	Description string `json:"description"`
	CastTime    string `json:"cast_time"`
	PowerCost   string `json:"power_cost"`
	Range       string `json:"range"`
	Cooldown    string `json:"cooldown"`
}

type keyJson struct {
	Href string `json:"href"`
}

func parseTalentTreeJson(treeJson *talentTreeJson) (wow.TalentTree, error) {
	classNodes := make([]wow.TalentNode, len(treeJson.ClassTalentNodes))
	for i, nodeJson := range treeJson.ClassTalentNodes {
		node, err := parseTalentNode(nodeJson)
		if err != nil && !errors.Is(err, errKnownBadNode) {
			return wow.TalentTree{}, err
		}
		classNodes[i] = node
	}

	specNodes := make([]wow.TalentNode, len(treeJson.SpecTalentNodes))
	for i, nodeJson := range treeJson.SpecTalentNodes {
		node, err := parseTalentNode(nodeJson)
		if err != nil && !errors.Is(err, errKnownBadNode) {
			return wow.TalentTree{}, err
		}
		specNodes[i] = node
	}

	heroTrees := make([]wow.HeroTree, len(treeJson.HeroTalentTrees))
	for i, treeJson := range treeJson.HeroTalentTrees {
		tree, err := parseHeroTree(treeJson)
		if err != nil && !errors.Is(err, errKnownBadNode) {
			return wow.TalentTree{}, err
		}
		heroTrees[i] = tree
	}

	return wow.TalentTree{
		ClassName:  treeJson.PlayableClass.Name,
		ClassId:    treeJson.Id,
		SpecName:   treeJson.PlayableSpecialization.Name,
		SpecId:     treeJson.PlayableSpecialization.Id,
		ClassNodes: classNodes,
		SpecNodes:  specNodes,
		HeroTrees:  heroTrees,
	}, nil
}

func parseHeroTree(heroTreeJson heroTreeJson) (wow.HeroTree, error) {
	nodes := make([]wow.TalentNode, len(heroTreeJson.TalentNodes))
	for i, nodeJson := range heroTreeJson.TalentNodes {
		node, err := parseTalentNode(nodeJson)
		if err != nil && !errors.Is(err, errKnownBadNode) {
			return wow.HeroTree{}, err
		}
		nodes[i] = node
	}
	return wow.HeroTree{
		Id:    heroTreeJson.Id,
		Name:  heroTreeJson.Name,
		Nodes: nodes,
	}, nil
}

func parseTalentNode(nodeJson talentNodeJson) (wow.TalentNode, error) {
	if len(nodeJson.Ranks) == 0 {
		// Augmentation seems to have an invisible node with no ranks.
		// For now we'll just ignore it.
		return wow.TalentNode{}, errKnownBadNode
	}

	maxRank := len(nodeJson.Ranks)
	var tooltips [][]tooltipJson
	if len(nodeJson.Ranks[0].ChoiceOfTooltips) == 1 {
		return wow.TalentNode{}, errors.New("only one choice available for multi talent node")
	} else if len(nodeJson.Ranks[0].ChoiceOfTooltips) == 2 {
		tooltips = [][]tooltipJson{
			{nodeJson.Ranks[0].ChoiceOfTooltips[0]},
			{nodeJson.Ranks[0].ChoiceOfTooltips[1]},
		}
	} else {
		tooltips = make([][]tooltipJson, maxRank)
		for i := range nodeJson.Ranks {
			rank := &nodeJson.Ranks[i]
			tooltips[i] = []tooltipJson{*rank.Tooltip}
		}
	}

	talents := make([]wow.Talent, 0, maxRank)
	for _, tooltipRank := range tooltips {
		baseTooltip := tooltipRank[0]
		baseSpellTooltip := baseTooltip.SpellTooltip
		baseSpell := baseSpellTooltip.Spell

		ranks := make([]wow.Rank, len(tooltipRank))
		for i, tooltip := range tooltipRank {
			spellTooltip := tooltip.SpellTooltip
			ranks[i] = wow.Rank{
				Description: spellTooltip.Description,
				CastTime:    spellTooltip.CastTime,
				PowerCost:   spellTooltip.PowerCost,
				Range:       spellTooltip.Range,
				Cooldown:    spellTooltip.Cooldown,
			}
		}

		spell := wow.Spell{
			Id:    baseSpell.Id,
			Name:  baseSpell.Name,
			Ranks: ranks,
		}

		talents = append(talents, wow.Talent{
			Id:    baseTooltip.Talent.Id,
			Name:  baseTooltip.Talent.Name,
			Spell: spell,
		})
	}

	lockedBy := nodeJson.LockedBy
	if lockedBy == nil {
		lockedBy = []int{}
	}

	unlocks := nodeJson.Unlocks
	if unlocks == nil {
		unlocks = []int{}
	}

	return wow.TalentNode{
		Talents:  talents,
		Id:       nodeJson.Id,
		NodeType: nodeJson.NodeType.Type,
		Unlocks:  unlocks,
		LockedBy: lockedBy,
		MaxRank:  maxRank,
		Row:      nodeJson.DisplayRow,
		Col:      nodeJson.DisplayCol,
		X:        nodeJson.RawPositionX,
		Y:        nodeJson.RawPositionY,
	}, nil
}