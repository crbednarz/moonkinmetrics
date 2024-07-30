package seasons

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

//go:embed schema/seasons-index.schema.json
var seasonsIndexSchema string

type SeasonsIndex struct {
	Seasons       []SeasonLink
	CurrentSeason SeasonLink
}

type SeasonLink struct {
	Id  int
	Url string
}

type seasonsIndexJson struct {
	Seasons []struct {
		Id  int     `json:"id"`
		Key keyJson `json:"key"`
	} `json:"seasons"`

	CurrentSeason struct {
		Id  int     `json:"id"`
		Key keyJson `json:"key"`
	} `json:"current_season"`
}

type keyJson struct {
	Href string `json:"href"`
}

func GetCurrentSeasonId(scanner *scan.Scanner) (int, error) {
	index, err := GetSeasonsIndex(scanner)
	if err != nil {
		return -1, err
	}

	return index.CurrentSeason.Id, nil
}

func GetSeasonsIndex(scanner *scan.Scanner) (SeasonsIndex, error) {
	validator, err := validate.NewSchemaValidator(seasonsIndexSchema)
	if err != nil {
		return SeasonsIndex{}, fmt.Errorf("failed to setup seasons index validator: %w", err)
	}
	result := scanner.RefreshSingle(scan.RefreshRequest{
		Lifespan: time.Hour,
		ApiRequest: bnet.Request{
			Region:    bnet.RegionUS,
			Namespace: bnet.NamespaceDynamic,
			Path:      "/data/wow/pvp-season/index",
		},
		Validator: validator,
	})

	if result.Error != nil {
		return SeasonsIndex{}, result.Error
	}

	return parseSeasonsIndex(result.Body)
}

func parseSeasonsIndex(data []byte) (SeasonsIndex, error) {
	indexJson := seasonsIndexJson{}

	err := json.Unmarshal(data, &indexJson)
	if err != nil {
		return SeasonsIndex{}, fmt.Errorf("failed to unmarshal seasons index: %w", err)
	}

	seasons := make([]SeasonLink, 0, len(indexJson.Seasons))
	for _, season := range indexJson.Seasons {
		seasons = append(seasons, SeasonLink{
			Id:  season.Id,
			Url: season.Key.Href,
		})
	}

	return SeasonsIndex{
		Seasons: seasons,
		CurrentSeason: SeasonLink{
			Id:  indexJson.CurrentSeason.Id,
			Url: indexJson.CurrentSeason.Key.Href,
		},
	}, nil
}
