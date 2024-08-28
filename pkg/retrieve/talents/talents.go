package talents

import (
	_ "embed"
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/hack"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed schema/talent-tree.schema.json
var talentTreeSchema string

// GetTalentTreeIndex retrieves the full talent tree of each spec.
// If the Battle.net API is missing a spec, fallback mechanisms will be
// used to retrieve the talent tree, though some information may be missing.
func GetTalentTrees(scanner *scan.Scanner) ([]wow.TalentTree, error) {
	index, err := GetTalentTreeIndex(scanner)
	if err != nil {
		return nil, err
	}

	// If we've already retrieved the ingame representation of a spec, we should
	// not retrieve it again from the Battle.net API.
	ingameTrees := hack.GetIngameTrees()
	specLinks := make([]SpecTreeLink, 0, len(index.SpecLinks))
	for _, specLink := range index.SpecLinks {
		found := false
		for _, ingameTree := range ingameTrees {
			if ingameTree.SpecId == specLink.SpecId {
				found = true
				break
			}
		}
		if !found {
			specLinks = append(specLinks, specLink)
		}
	}

	trees, err := getTreesFromSpecTrees(scanner, specLinks)
	if err != nil {
		return nil, err
	}

	// If the Battle.net API is missing a spec, fallback to the ingame talent tree.
	for _, ingameTree := range ingameTrees {
		log.Printf("retrieving talent tree from ingame data: %v - %v", ingameTree.ClassName, ingameTree.SpecName)
		tree, err := talentTreeFromIngame(scanner, ingameTree)
		if err != nil {
			return nil, err
		}
		trees = append(trees, tree)
	}

	log.Printf("retrieving pvp talents")
	err = attachPvpTalents(scanner, trees)
	if err != nil {
		return nil, err
	}

	return trees, nil
}

func attachPvpTalents(scanner *scan.Scanner, trees []wow.TalentTree) error {
	pvpTalents, err := GetPvpTalents(scanner)
	if err != nil {
		return fmt.Errorf("failed to retrieve pvp talents: %v", err)
	}

	for _, pvpTalent := range pvpTalents {
		for _, tree := range trees {
			if tree.SpecId == pvpTalent.SpecId {
				tree.PvpTalents = append(tree.PvpTalents, pvpTalent.Talent)
				break
			}
		}
	}

	return nil
}

func getTreesFromSpecTrees(scanner *scan.Scanner, specLinks []SpecTreeLink) ([]wow.TalentTree, error) {
	validator, err := validate.NewLegacySchemaValidator(talentTreeSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup talent tree validator: %w", err)
	}

	numTrees := len(specLinks)
	requests := make(chan scan.RefreshRequest, numTrees)
	results := make(chan scan.RefreshResult, numTrees)

	scanner.Refresh(requests, results)
	for _, specLink := range specLinks {
		apiRequest, err := bnet.RequestFromUrl(specLink.Url)
		if err != nil {
			return nil, err
		}

		requests <- scan.RefreshRequest{
			Lifespan:   time.Hour,
			ApiRequest: apiRequest,
			Validator:  validator,
		}
	}
	close(requests)

	trees := make([]wow.TalentTree, 0, numTrees)
	for i := 0; i < numTrees; i++ {
		result := <-results
		log.Printf("retrieving talent tree: %v", result.ApiRequest.Path)
		if result.Error != nil {
			path := result.ApiRequest.Path
			log.Printf("failed to retrieve talent tree (%s): %v", path, result.Error)
			continue
		}

		tree, err := parseTalentTreeJson(result.Body)
		if err != nil {
			path := result.ApiRequest.Path
			log.Printf("failed to parse talent tree json (%s): %v", path, err)
			continue
		}

		trees = append(trees, tree)
	}

	return trees, nil
}
