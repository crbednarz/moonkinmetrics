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

//go:embed schema/spell-media.schema.json
var spellMediaSchema string

type spellMediaJson struct {
	Assets []assetJson `json:"assets"`
	Id     int         `json:"id"`
}

type assetJson struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func GetSpellMedia(scanner *scan.Scanner, trees []wow.TalentTree) (map[int]string, error) {
	validator, err := validate.NewSchemaValidator[spellMediaJson](spellMediaSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup spell media validator: %w", err)
	}

	talentCount := countTalents(trees)

	requests := make(chan bnet.Request, talentCount)
	results := make(chan scan.ScanResult[spellMediaJson], talentCount)
	options := scan.ScanOptions[spellMediaJson]{
		Validator: validator,
		Lifespan:  time.Hour * 24,
	}
	mediaDict := make(map[int]string, talentCount)
	scan.Scan(scanner, requests, results, &options)
	for treeIndex := range trees {
		tree := &trees[treeIndex]
		for nodeIndex := range tree.ClassNodes {
			node := &tree.ClassNodes[nodeIndex]
			for talentIndex := range node.Talents {
				talent := &node.Talents[talentIndex]
				requests <- bnet.Request{
					Region:    bnet.RegionUS,
					Namespace: bnet.NamespaceStatic,
					Path:      fmt.Sprintf("/data/wow/media/spell/%d", talent.Spell.Id),
				}
			}
		}
		for nodeIndex := range tree.SpecNodes {
			node := &tree.SpecNodes[nodeIndex]
			for talentIndex := range node.Talents {
				talent := &node.Talents[talentIndex]
				requests <- bnet.Request{
					Region:    bnet.RegionUS,
					Namespace: bnet.NamespaceStatic,
					Path:      fmt.Sprintf("/data/wow/media/spell/%d", talent.Spell.Id),
				}
			}
		}
		for talentIndex := range tree.PvpTalents {
			talent := &tree.PvpTalents[talentIndex]
			requests <- bnet.Request{
				Region:    bnet.RegionUS,
				Namespace: bnet.NamespaceStatic,
				Path:      fmt.Sprintf("/data/wow/media/spell/%d", talent.Spell.Id),
			}
		}
	}
	close(requests)

	for result := range results {
		if result.Error != nil {
			return nil, result.Error
		}
		mediaDict[result.Response.Id] = result.Response.Assets[0].Value
	}
	return mediaDict, nil
}

func countTalents(trees []wow.TalentTree) int {
	count := 0
	for _, tree := range trees {
		for _, node := range tree.ClassNodes {
			count += len(node.Talents)
		}
		for _, node := range tree.SpecNodes {
			count += len(node.Talents)
		}
		count += len(tree.PvpTalents)
	}
	return count
}