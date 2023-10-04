package talents

import (
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

func GetTalentTrees(scanner *scan.Scanner) ([]wow.TalentTree, error) {
	index, err := GetTalentTreeIndex(scanner)
	if err != nil {
		return nil, err
	}

	numTrees := len(index.SpecLinks)
	requests := make(chan scan.RefreshRequest, numTrees)
	results := make(chan scan.RefreshResult, numTrees)

	scanner.Refresh(requests, results)
	for _, specLink := range index.SpecLinks {
		apiRequest, err := bnet.RequestFromUrl(specLink.Url)
		if err != nil {
			return nil, err
		}

		requests <- scan.RefreshRequest{
			Lifespan:   time.Hour,
			ApiRequest: apiRequest,
			Validator:  nil,
		}
	}
	close(requests)

	trees := make([]wow.TalentTree, numTrees)
	for i := 0; i < numTrees; i++ {
		result := <-results
		if result.Error != nil {
			return nil, fmt.Errorf("failed to retrieve talent tree: %v", result.Error)
		}

		tree, err := parseTalentTreeJson(result.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to parse talent tree json: %v", err)
		}

		trees[i] = tree
		log.Printf("Retrieved talent tree: %v", tree)
	}

	pvpTalents, err := GetPvpTalents(scanner)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve pvp talents: %v", err)
	}

	for _, pvpTalent := range pvpTalents {
		for _, tree := range trees {
			if tree.SpecId == pvpTalent.SpecId {
				tree.PvpTalents = append(tree.PvpTalents, pvpTalent.Talent)
				break
			}
		}
	}

	return trees, nil
}
