package talents

import (
	_ "embed"
	"encoding/json"
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
	SpecId int
	Talent wow.Talent
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
	Id    int `json:"id"`
	Spell struct {
		Id   int    `json:"id"`
		Name string `json:"name"`
		Key  struct {
			Href string `json:"href"`
		} `json:"key"`
	} `json:"spell"`
	PlayableSpecialization struct {
		Id   int    `json:"id"`
		Name string `json:"name"`
		Key  struct {
			Href string `json:"href"`
		} `json:"key"`
	} `json:"playable_specialization"`
	Description string `json:"description"`
}

func GetPvpTalents(scanner *scan.Scanner) ([]PvpTalent, error) {
	index, err := getPvpTalentsIndex(scanner)
	if err != nil {
		return nil, fmt.Errorf("failed to get pvp talent index: %w", err)
	}

	return getPvpTalentsFromIndex(scanner, index)
}

func getPvpTalentsIndex(scanner *scan.Scanner) (*pvpTalentsIndexJson, error) {
	validator, err := validate.NewLegacySchemaValidator(pvpTalentIndexSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup pvp talent index validator: %w", err)
	}

	indexResponse := scanner.RefreshSingle(scan.RefreshRequest{
		Lifespan: time.Hour * 24,
		ApiRequest: bnet.Request{
			Namespace: bnet.NamespaceStatic,
			Region:    bnet.RegionUS,
			Path:      "/data/wow/pvp-talent/index",
		},
		Validator: validator,
	})

	if indexResponse.Error != nil {
		return nil, fmt.Errorf("failed to refresh pvp talent index: %w", indexResponse.Error)
	}

	var index pvpTalentsIndexJson
	err = json.Unmarshal(indexResponse.Body, &index)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal pvp talent index: %w", err)
	}

	return &index, nil
}

func getPvpTalentsFromIndex(scanner *scan.Scanner, index *pvpTalentsIndexJson) ([]PvpTalent, error) {
	validator, err := validate.NewLegacySchemaValidator(pvpTalentSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup pvp talent validator: %w", err)
	}

	numTalents := len(index.PvpTalents)
	requests := make(chan scan.RefreshRequest, numTalents)
	results := make(chan scan.RefreshResult, numTalents)

	scanner.Refresh(requests, results)

	for _, talent := range index.PvpTalents {
		apiRequest, err := bnet.RequestFromUrl(talent.Key.Href)
		if err != nil {
			return nil, fmt.Errorf("failed to parse pvp talent url: %w", err)
		}

		requests <- scan.RefreshRequest{
			Lifespan:   time.Hour * 24,
			ApiRequest: apiRequest,
			Validator:  validator,
		}
	}
	close(requests)

	talents := make([]PvpTalent, numTalents)
	for i := 0; i < numTalents; i++ {
		result := <-results
		if result.Error != nil {
			return nil, fmt.Errorf("can't get pvp talents (%s): %w", result.ApiRequest.Path, result.Error)
		}
		talent, err := parsePvpTalent(result.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to parse pvp talent: %w", err)
		}
		talents[i] = talent
	}

	return talents, nil
}

func parsePvpTalent(body []byte) (PvpTalent, error) {
	var talent pvpTalentJson
	err := json.Unmarshal(body, &talent)
	if err != nil {
		return PvpTalent{}, fmt.Errorf("failed to unmarshal pvp talent: %w", err)
	}

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
	}, nil
}
