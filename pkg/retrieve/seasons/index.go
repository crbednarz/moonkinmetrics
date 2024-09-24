package seasons

import (
	_ "embed"
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

func GetCurrentSeasonId(scanner *scan.Scanner, region bnet.Region) (int, error) {
	index, err := GetSeasonsIndex(scanner, region)
	if err != nil {
		return -1, err
	}

	return index.CurrentSeason.Id, nil
}

func GetSeasonsIndex(scanner *scan.Scanner, region bnet.Region) (SeasonsIndex, error) {
	validator, err := validate.NewSchemaValidator[seasonsIndexJson](seasonsIndexSchema)
	if err != nil {
		return SeasonsIndex{}, fmt.Errorf("failed to setup seasons index validator: %w", err)
	}
	result := scan.ScanSingle(
		scanner,
		bnet.Request{
			Region:    region,
			Namespace: bnet.NamespaceDynamic,
			Path:      "/data/wow/pvp-season/index",
		},
		&scan.ScanOptions[seasonsIndexJson]{
			Validator: validator,
			Lifespan:  time.Hour * 18,
		},
	)
	if result.Error != nil {
		return SeasonsIndex{}, result.Error
	}

	return parseSeasonsIndex(&result.Response), nil
}

func parseSeasonsIndex(indexJson *seasonsIndexJson) SeasonsIndex {
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
	}
}
