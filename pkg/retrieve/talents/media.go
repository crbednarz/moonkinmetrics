package talents

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type spellMediaJson struct {
	Assets []assetJson `json:"assets"`
	Id     int         `json:"id"`
}

type assetJson struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func GetSpellMedia(scanner *scan.Scanner, trees []wow.TalentTree) (map[int]string, error) {
	talentCount := countTalents(trees)

	requests := make(chan bnet.Request, talentCount)
	results := make(chan scan.ScanResult[spellMediaJson], talentCount)
	options := scan.ScanOptions[spellMediaJson]{
		Validator: nil,
		Lifespan:  time.Hour * 24 * 7,
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

		for heroTreeIndex := range tree.HeroTrees {
			heroTree := &tree.HeroTrees[heroTreeIndex]
			for nodeIndex := range heroTree.Nodes {
				for talentIndex := range heroTree.Nodes[nodeIndex].Talents {
					talent := &heroTree.Nodes[nodeIndex].Talents[talentIndex]
					requests <- bnet.Request{
						Region:    bnet.RegionUS,
						Namespace: bnet.NamespaceStatic,
						Path:      fmt.Sprintf("/data/wow/media/spell/%d", talent.Spell.Id),
					}
				}
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
