package talents

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/hack"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed schema/talent.schema.json
var talentSchema string

type talentJson struct {
	Id               int `json:"id"`
	RankDescriptions []struct {
		Rank        int    `json:"rank"`
		Description string `json:"description"`
	} `json:"rank_descriptions"`
	Spell struct {
		Id   int     `json:"id"`
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
	} `json:"spell"`
	PlayableClass struct {
		Id   int     `json:"id"`
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
	} `json:"playable_class"`
	PlayableSpecialization *struct {
		Id   int     `json:"id"`
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
	} `json:"playable_specialization"`
}

func talentTreeFromIngame(scanner *scan.Scanner, ingameTree hack.IngameTree) (wow.TalentTree, error) {
	talentIds := getAllTalentIds(ingameTree)
	talentsJson, err := getTalentsJsonFromIds(scanner, talentIds)
	if err != nil {
		return wow.TalentTree{}, fmt.Errorf("failed to retrieve talents: %v", err)
	}

	specNodes := make([]wow.TalentNode, 0, len(ingameTree.Nodes))
	classNodes := make([]wow.TalentNode, 0, len(ingameTree.Nodes))

	for _, ingameNode := range ingameTree.Nodes {
		talents := make([]wow.Talent, 0, len(ingameNode.TalentIds))
		isSpecNode := false
		for _, talentId := range ingameNode.TalentIds {
			talent, ok := talentsJson[talentId]
			if !ok {
				return wow.TalentTree{}, fmt.Errorf("talent %d not found", talentId)
			}
			talents = append(talents, parseTalentJson(talent))
			isSpecNode = isSpecNode || talent.PlayableSpecialization != nil
		}
		node := wow.TalentNode{
			Id:       ingameNode.Id,
			X:        ingameNode.PosX,
			Y:        ingameNode.PosY,
			Row:      0,
			Col:      0,
			Unlocks:  make([]int, 0),
			LockedBy: ingameNode.LockedBy,
			MaxRank:  len(talents[0].Spell.Ranks),
			NodeType: "MISSING",
			Talents:  talents,
		}
		if isSpecNode {
			specNodes = append(specNodes, node)
		} else {
			classNodes = append(classNodes, node)
		}
	}
	return wow.TalentTree{
		ClassName:  ingameTree.ClassName,
		SpecName:   ingameTree.SpecName,
		SpecId:     ingameTree.SpecId,
		ClassId:    ingameTree.ClassId,
		ClassNodes: classNodes,
		SpecNodes:  specNodes,
		PvpTalents: make([]wow.Talent, 0),
	}, nil
}

func parseTalentJson(talent talentJson) wow.Talent {
	ranks := make([]wow.Rank, 0, len(talent.RankDescriptions))
	for _, rank := range talent.RankDescriptions {
		ranks = append(ranks, wow.Rank{
			Description: rank.Description,
		})
	}
	return wow.Talent{
		Id:   talent.Id,
		Name: talent.Spell.Name,
		Spell: wow.Spell{
			Id:    talent.Spell.Id,
			Name:  talent.Spell.Name,
			Ranks: ranks,
		},
	}
}

func getTalentsJsonFromIds(scanner *scan.Scanner, talentIds []int) (map[int]talentJson, error) {
	validator, err := validate.NewSchemaValidator[talentJson](talentSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to create talent validator: %v", err)
	}

	requests := make(chan api.BnetRequest, len(talentIds))
	results := make(chan scan.ScanResult[talentJson], len(talentIds))
	options := scan.ScanOptions[talentJson]{
		Validator: validator,
		Lifespan:  time.Hour * 18,
	}

	scan.Scan(scanner, requests, results, &options)
	for _, talentId := range talentIds {
		apiRequest := api.BnetRequest{
			Region:    api.RegionUS,
			Namespace: api.NamespaceStatic,
			Path:      fmt.Sprintf("/data/wow/talent/%d", talentId),
		}

		requests <- apiRequest
	}
	close(requests)

	talents := make(map[int]talentJson, len(talentIds))

	for i := 0; i < len(talentIds); i++ {
		result := <-results
		if result.Error != nil {
			return nil, fmt.Errorf("failed to retrieve talent (%v): %w", result.ApiRequest.Path, result.Error)
		}

		talents[result.Response.Id] = result.Response
	}

	return talents, nil
}

func getAllTalentIds(ingameTree hack.IngameTree) []int {
	count := 0
	for _, node := range ingameTree.Nodes {
		count += len(node.TalentIds)
	}
	talentIds := make([]int, 0, count)
	for _, node := range ingameTree.Nodes {
		talentIds = append(talentIds, node.TalentIds...)
	}
	return talentIds
}
