package players

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed schema/realm.schema.json
var realmSchema string

type realmJson struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Id   int    `json:"id"`
}

func GetRealms(scanner *scan.Scanner, realmLinks []wow.RealmLink) ([]wow.Realm, error) {
	validator, err := validate.NewSchemaValidator[realmJson](realmSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup realm validator: %w", err)
	}

	requests := make(chan api.Request, len(realmLinks))
	results := make(chan scan.ScanResult[realmJson], len(realmLinks))
	options := scan.ScanOptions[realmJson]{
		Validator: validator,
		Lifespan:  time.Hour * 18,
		Repairs:   nil,
	}

	scan.Scan(scanner, requests, results, &options)

	for _, realmLink := range realmLinks {
		request, err := api.RequestFromUrl(realmLink.Url)
		if err != nil {
			return nil, fmt.Errorf("failed to create request from realm link [%v]: %w", realmLink.Url, err)
		}

		requests <- &request
	}
	close(requests)

	realms := make([]wow.Realm, 0, len(realmLinks))
	for result := range results {
		if result.Error != nil {
			return nil, fmt.Errorf("failed to retrieve realm [%v]: %w", result.ApiRequest.Id(), result.Error)
		}
		realms = append(realms, wow.Realm{
			Name: result.Response.Name,
			Slug: result.Response.Slug,
			Id:   result.Response.Id,
		})
	}
	return realms, nil
}
