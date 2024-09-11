package talents

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

var (
	//go:embed schema/pvp-talent-index.schema.json
	pvpTalentIndexSchema string

	//go:embed schema/pvp-talent.schema.json
	pvpTalentSchema string
)

type PvpTalent struct {
	Talent wow.Talent
	SpecId int
}

type pvpTalentsIndexJson struct {
	PvpTalents []struct {
		Key struct {
			Href string `json:"href"`
		} `json:"key"`
		Name string `json:"name"`
		Id   int    `json:"id"`
	} `json:"pvp_talents"`
}

type pvpTalentJson struct {
	Description string `json:"description"`
	Spell       struct {
		Name string `json:"name"`
		Key  struct {
			Href string `json:"href"`
		} `json:"key"`
		Id int `json:"id"`
	} `json:"spell"`
	PlayableSpecialization struct {
		Name string `json:"name"`
		Key  struct {
			Href string `json:"href"`
		} `json:"key"`
		Id int `json:"id"`
	} `json:"playable_specialization"`
	Id int `json:"id"`
}

func GetPvpTalents(scanner *scan.Scanner) ([]PvpTalent, error) {
	index, err := getPvpTalentsIndex(scanner)
	if err != nil {
		return nil, fmt.Errorf("failed to get pvp talent index: %w", err)
	}

	return getPvpTalentsFromIndex(scanner, index)
}

func getPvpTalentsIndex(scanner *scan.Scanner) (*pvpTalentsIndexJson, error) {
	validator, err := validate.NewSchemaValidator[pvpTalentsIndexJson](pvpTalentIndexSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup pvp talent index validator: %w", err)
	}

	indexResult := scan.ScanSingle(
		scanner,
		bnet.Request{
			Namespace: bnet.NamespaceStatic,
			Region:    bnet.RegionUS,
			Path:      "/data/wow/pvp-talent/index",
		},
		&scan.ScanOptions[pvpTalentsIndexJson]{
			Validator: validator,
			Lifespan:  time.Hour * 24,
		},
	)

	if indexResult.Error != nil {
		return nil, fmt.Errorf("failed to scan pvp talent index: %w", indexResult.Error)
	}

	return &indexResult.Response, nil
}

func getPvpTalentsFromIndex(scanner *scan.Scanner, index *pvpTalentsIndexJson) ([]PvpTalent, error) {
	validator, err := validate.NewSchemaValidator[pvpTalentJson](pvpTalentSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup pvp talent validator: %w", err)
	}

	numTalents := len(index.PvpTalents)
	requests := make(chan bnet.Request, numTalents)
	results := make(chan scan.ScanResult[pvpTalentJson], numTalents)
	options := scan.ScanOptions[pvpTalentJson]{
		Validator: validator,
		Lifespan:  time.Hour * 24,
	}

	scan.Scan(scanner, requests, results, &options)

	for _, talent := range index.PvpTalents {
		apiRequest, err := bnet.RequestFromUrl(talent.Key.Href)
		if err != nil {
			return nil, fmt.Errorf("failed to parse pvp talent url: %w", err)
		}

		requests <- apiRequest
	}
	close(requests)

	talents := make([]PvpTalent, numTalents)
	for i := 0; i < numTalents; i++ {
		result := <-results
		if result.Error != nil {
			return nil, fmt.Errorf("can't get pvp talents (%s): %w", result.ApiRequest.Path, result.Error)
		}
		talent := parsePvpTalent(&result.Response)
		talents[i] = talent
	}

	return talents, nil
}

func parsePvpTalent(talent *pvpTalentJson) PvpTalent {
	return PvpTalent{
		SpecId: talent.PlayableSpecialization.Id,
		Talent: wow.Talent{
			Id:   talent.Spell.Id,
			Name: talent.Spell.Name,
			Spell: wow.Spell{
				Id:   talent.Spell.Id,
				Name: talent.Spell.Name,
				Ranks: []wow.Rank{{
					Description: talent.Description,
				}},
			},
		},
	}
}
