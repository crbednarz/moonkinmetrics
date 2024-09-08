package serialize

import (
	_ "embed"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/wow"
	"github.com/stretchr/testify/assert"
)

//go:embed testdata/mock-tree.json
var mockTree []byte

func mockNodes(count int) []wow.TalentNode {
	nodes := make([]wow.TalentNode, count)
	for i := 0; i < count; i++ {
		nodes[i] = wow.TalentNode{
			Id:       i,
			X:        0,
			Y:        0,
			Row:      0,
			Col:      0,
			Unlocks:  []int{},
			LockedBy: []int{},
			MaxRank:  1,
			Talents:  mockTalents(1),
			NodeType: "ACTIVE",
		}
	}
	return nodes
}

func mockTalents(count int) []wow.Talent {
	talents := make([]wow.Talent, count)
	for i := 0; i < count; i++ {
		talents[i] = wow.Talent{
			Id:   i,
			Name: "Talent",
			Icon: "Icon",
			Spell: wow.Spell{
				Id:   i,
				Name: "Spell",
				Ranks: []wow.Rank{
					{
						Name:        "Rank 1",
						Description: "Rank 1",
					},
				},
			},
		}
	}
	return talents
}

func TestCanExportTalents(t *testing.T) {
	tree := wow.TalentTree{
		ClassName:  "Druid",
		SpecName:   "Balance",
		ClassNodes: mockNodes(30),
		SpecNodes:  mockNodes(31),
	}

	serializedTalents, err := ExportTalentsToJson(&tree)
	if err != nil {
		t.Fatalf("Error exporting talents: %v", err)
	}

	assert.JSONEq(t, string(mockTree), string(serializedTalents))
}
