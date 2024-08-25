package players

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

//go:embed schema/specializations.schema.json
var specializationsSchema string

type LoadoutResponse struct {
	Loadout wow.Loadout
	Error   error
}

type specializationsJson struct {
	Specializations      []specializationJson `json:"specializations"`
	ActiveSpecialization struct {
		Name string  `json:"name"`
		Id   int     `json:"id"`
		Key  keyJson `json:"key"`
	} `json:"active_specialization"`
	Character charaterJson `json:"character"`
}

type specializationJson struct {
	Specialization struct {
		Name string  `json:"name"`
		Id   int     `json:"id"`
		Key  keyJson `json:"key"`
	} `json:"specialization"`
	PvpTalentSlots []pvpTalentSlotJson `json:"pvp_talent_slots"`
	Loadouts       []loadoutJson       `json:"loadouts"`
}

type pvpTalentSlotJson struct {
	SlotNumber int         `json:"slot_number"`
	Selected   tooltipJson `json:"selected"`
}

type tooltipJson struct {
	Talent struct {
		Name string  `json:"name"`
		Id   int     `json:"id"`
		Key  keyJson `json:"key"`
	} `json:"talent"`
	SpellTooltip struct {
		Spell struct {
			Name string  `json:"name"`
			Id   int     `json:"id"`
			Key  keyJson `json:"key"`
		} `json:"spell"`
	} `json:"spell_tooltip"`
}

type loadoutJson struct {
	IsActive                bool         `json:"is_active"`
	TalentLoadoutCode       string       `json:"talent_loadout_code"`
	SelectedClassTalents    []talentJson `json:"selected_class_talents"`
	SelectedSpecTalets      []talentJson `json:"selected_spec_talents"`
	SelectedClassTalentTree struct {
		Name string  `json:"name"`
		Id   int     `json:"id"`
		Key  keyJson `json:"key"`
	} `json:"selected_class_talent_tree"`
	SelectedSpecTalentTree struct {
		Name string  `json:"name"`
		Id   int     `json:"id"`
		Key  keyJson `json:"key"`
	} `json:"selected_spec_talent_tree"`
}

type talentJson struct {
	Id      int         `json:"id"`
	Rank    int         `json:"rank"`
	Tooltip tooltipJson `json:"tooltip"`
}

type charaterJson struct {
	Key   keyJson   `json:"key"`
	Name  string    `json:"name"`
	Id    int       `json:"id"`
	Realm realmJson `json:"realm"`
}

type realmJson struct {
	Key  keyJson `json:"key"`
	Name string  `json:"name"`
	Id   int     `json:"id"`
	Slug string  `json:"slug"`
}

type keyJson struct {
	Href string `json:"href"`
}

type LoadoutScanConfig struct {
	OverrideSpec string
}

func GetPlayerLoadouts(scanner *scan.Scanner, players []wow.PlayerLink, config LoadoutScanConfig) ([]LoadoutResponse, error) {
	validator, err := validate.NewSchemaValidator(specializationsSchema)
	if err != nil {
		return nil, fmt.Errorf("failed to setup specialization validator: %w", err)
	}

	requests := make(chan scan.RefreshRequest, len(players))
	results := make(chan scan.RefreshResult, len(players))

	scanner.Refresh(requests, results)
	for _, player := range players {
		requests <- scan.RefreshRequest{
			Lifespan: time.Hour * 4,
			ApiRequest: bnet.Request{
				Region:    bnet.RegionUS,
				Namespace: bnet.NamespaceProfile,
				Path:      player.SpecializationUrl(),
			},
			Validator: validator,
		}
	}
	close(requests)

	loadouts := make([]LoadoutResponse, len(players))
	for i := 0; i < len(loadouts); i++ {
		result := <-results
		log.Printf("retrieved player loadout: %v", result.ApiRequest.Path)
		if result.Error != nil {
			path := result.ApiRequest.Path
			loadouts[result.Index].Error = result.Error
			log.Printf("failed to retrieve player loadout (%s): %v", path, result.Error)
			continue
		}

		loadout, err := activeLoadoutFromSpecializationsJson(result.Body, &config)
		loadouts[result.Index].Loadout = loadout
		loadouts[result.Index].Error = err
		if err != nil {
			path := result.ApiRequest.Path
			log.Printf("failed to parse player loadout json (%s): %v", path, err)
			continue
		}
	}

	return loadouts, nil
}

func activeLoadoutFromSpecializationsJson(rawJson []byte, config *LoadoutScanConfig) (wow.Loadout, error) {
	var inputJson specializationsJson
	err := json.Unmarshal(rawJson, &inputJson)
	if err != nil {
		return wow.Loadout{}, err
	}

	activeSpec := inputJson.ActiveSpecialization.Name
	if config.OverrideSpec != "" {
		activeSpec = config.OverrideSpec
	}

	for _, specializationJson := range inputJson.Specializations {
		if specializationJson.Specialization.Name != activeSpec {
			continue
		}

		for _, loadoutJson := range specializationJson.Loadouts {
			if !loadoutJson.IsActive {
				loadout := parseLoadout(loadoutJson)
				loadout.PvpTalents = parsePvpTalents(specializationJson.PvpTalentSlots)
				return loadout, nil
			}
		}
		break
	}

	return wow.Loadout{}, fmt.Errorf(
		"unable to find active loadout - spec: %s, player: %s-%s",
		activeSpec,
		inputJson.Character.Name,
		inputJson.Character.Realm.Name,
	)
}

func parseLoadout(inputJson loadoutJson) wow.Loadout {
	classNodes := make([]wow.LoadoutNode, len(inputJson.SelectedClassTalents))
	for i, talent := range inputJson.SelectedClassTalents {
		classNodes[i] = parseNode(talent)
	}

	specNodes := make([]wow.LoadoutNode, len(inputJson.SelectedSpecTalets))
	for i, talent := range inputJson.SelectedSpecTalets {
		specNodes[i] = parseNode(talent)
	}

	return wow.Loadout{
		ClassName:  inputJson.SelectedClassTalentTree.Name,
		SpecName:   inputJson.SelectedSpecTalentTree.Name,
		ClassNodes: classNodes,
		SpecNodes:  specNodes,
		PvpTalents: nil,
		Code:       inputJson.TalentLoadoutCode,
	}
}

func parseNode(inputJson talentJson) wow.LoadoutNode {
	return wow.LoadoutNode{
		TalentName: inputJson.Tooltip.Talent.Name,
		NodeId:     inputJson.Id,
		TalentId:   inputJson.Tooltip.Talent.Id,
		Rank:       inputJson.Rank,
	}
}

func parsePvpTalents(inputJson []pvpTalentSlotJson) []wow.LoadoutPvpTalent {
	pvpTalents := make([]wow.LoadoutPvpTalent, len(inputJson))
	for i, slot := range inputJson {
		pvpTalents[i] = wow.LoadoutPvpTalent{Id: slot.Selected.Talent.Id}
	}
	return pvpTalents
}
