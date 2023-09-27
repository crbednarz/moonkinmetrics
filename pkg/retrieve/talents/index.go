package talents

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
)

//go:embed schema/talent-tree-index.schema.json
var talentTreeIndexSchema string

var (
	classTreeLinkRegex = regexp.MustCompile(`/talent-tree/(\d+)`)
	specTreeLinkRegex  = regexp.MustCompile(`/talent-tree/(\d+)/[^/]+/(\d+)`)
)

type ClassTreeLink struct {
	ClassId   int
	Url       string
	ClassName string
}

type SpecTreeLink struct {
	ClassId  int
	SpecId   int
	Url      string
	SpecName string
}

type TalentTreeIndex struct {
	ClassLinks []ClassTreeLink
	SpecLinks  []SpecTreeLink
}

type treeLinkJson struct {
	Key struct {
		Href string `json:"href"`
	} `json:"key"`
	Name string `json:"name"`
}

type treeIndexJson struct {
	ClassTalentTrees []treeLinkJson `json:"class_talent_trees"`
	SpecTalentTrees  []treeLinkJson `json:"spec_talent_trees"`
}

func GetTalentTreeIndex(scanner *scan.Scanner) (*TalentTreeIndex, error) {
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

	return parseTalentTreeIndex(result.Body)
}

func parseTalentTreeIndex(data []byte) (*TalentTreeIndex, error) {
	indexJson := treeIndexJson{}

	err := json.Unmarshal(data, &indexJson)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal talent tree index: %w", err)
	}

	classLinks := make([]ClassTreeLink, len(indexJson.ClassTalentTrees))
	for i, classTreeJson := range indexJson.ClassTalentTrees {
		classLink, err := parseClassLink(classTreeJson)
		if err != nil {
			return nil, fmt.Errorf("failed to parse class link: %w", err)
		}
		classLinks[i] = classLink
	}

	specLinks := make([]SpecTreeLink, len(indexJson.SpecTalentTrees))
	for i, specTreeJson := range indexJson.SpecTalentTrees {
		specLink, err := parseSpecLink(specTreeJson)
		if err != nil {
			return nil, fmt.Errorf("failed to parse spec link: %w", err)
		}
		specLinks[i] = specLink
	}

	return &TalentTreeIndex{
		ClassLinks: classLinks,
		SpecLinks:  specLinks,
	}, nil
}

func parseClassLink(linkJson treeLinkJson) (ClassTreeLink, error) {
	url := linkJson.Key.Href
	matches := classTreeLinkRegex.FindStringSubmatch(url)
	if len(matches) != 2 {
		return ClassTreeLink{}, fmt.Errorf("failed to parse class tree link: %s", url)
	}

	classId, err := strconv.Atoi(matches[1])
	if err != nil {
		return ClassTreeLink{}, fmt.Errorf("failed to parse class id: %w", err)
	}

	return ClassTreeLink{
		ClassId:   classId,
		Url:       url,
		ClassName: linkJson.Name,
	}, nil
}

func parseSpecLink(linkJson treeLinkJson) (SpecTreeLink, error) {
	url := linkJson.Key.Href
	matches := specTreeLinkRegex.FindStringSubmatch(url)
	if len(matches) != 3 {
		return SpecTreeLink{}, fmt.Errorf("failed to parse spec tree link: %s", url)
	}

	classId, err := strconv.Atoi(matches[1])
	if err != nil {
		return SpecTreeLink{}, fmt.Errorf("failed to parse class id: %w", err)
	}
	specId, err := strconv.Atoi(matches[2])
	if err != nil {
		return SpecTreeLink{}, fmt.Errorf("failed to parse spec id: %w", err)
	}

	return SpecTreeLink{
		ClassId:  classId,
		SpecId:   specId,
		Url:      url,
		SpecName: linkJson.Name,
	}, nil
}
