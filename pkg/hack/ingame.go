package hack

import (
	_ "embed"
	"encoding/json"
)

type IngameNode struct {
	Id        int   `json:"id"`
	LockedBy  []int `json:"locked_by"`
	Flags     int   `json:"flags"`
	PosX      int   `json:"pos_x"`
	PosY      int   `json:"pos_y"`
	TalentIds []int `json:"talent_ids"`
}

type IngameTree struct {
	ClassName string       `json:"class_name"`
	ClassId   int          `json:"class_id"`
	SpecName  string       `json:"spec_name"`
	SpecId    int          `json:"spec_id"`
	Nodes     []IngameNode `json:"nodes"`
}

func GetIngameTrees() []IngameTree {
	var treeJsons = [][]byte{}

	var trees = make([]IngameTree, len(treeJsons))
	for i := range treeJsons {
		json.Unmarshal(treeJsons[i], &trees[i])
	}

	return trees
}
