package retrieve

import (
	_ "embed"
	"fmt"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

var (
	//go:embed schema/talent-tree-index.schema.json
	talentTreeIndexSchema string
)

func GetTalentTrees(scanner *scan.Scanner) ([]wow.TalentTree, error) {
	validator, err := validate.NewSchemaValidator(talentTreeIndexSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup talent index validator: %w", err)
	}
	result := scanner.RefreshSingle(scan.RefreshRequest{
		Lifespan: time.Hour * 24,
		ApiRequest: bnet.Request{
			Region:    bnet.RegionUS,
			Namespace: bnet.NamespaceStatic,
			Path:      "/data/wow/talent-tree/index",
		},
		Validator: validator,
	})

	if result.Error != nil {
		return nil, result.Error
	}

	println(string(result.Body))

	return nil, fmt.Errorf("not implemented")
}
