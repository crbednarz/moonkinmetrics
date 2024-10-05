package players

import (
	_ "embed"
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/validate"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type LoadoutResponse struct {
	Error   error
	Loadout wow.Loadout
}

type specializationsJson struct {
	Specializations      []specializationJson `json:"specializations" validate:"nonnil,min=1"`
	ActiveSpecialization struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"active_specialization"`
	Character charaterJson `json:"character"`
}

type specializationJson struct {
	Specialization struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"specialization"`
	PvpTalentSlots []pvpTalentSlotJson `json:"pvp_talent_slots" validate:"nonnil,min=1"`
	Loadouts       []loadoutJson       `json:"loadouts" validate:"nonnil,min=1"`
}

type pvpTalentSlotJson struct {
	Selected   tooltipJson `json:"selected"`
	SlotNumber int         `json:"slot_number"`
}

type tooltipJson struct {
	Talent struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"talent"`
	SpellTooltip struct {
		Spell struct {
			Name string  `json:"name"`
			Key  keyJson `json:"key"`
			Id   int     `json:"id"`
		} `json:"spell"`
	} `json:"spell_tooltip"`
}

type loadoutJson struct {
	SelectedClassTalents    []talentJson `json:"selected_class_talents" validate:"nonnil,min=1"`
	SelectedSpecTalents     []talentJson `json:"selected_spec_talents" validate:"nonnil,min=1"`
	SelectedHeroTalents     []talentJson `json:"selected_hero_talents" validate:"nonnil,min=1"`
	TalentLoadoutCode       string       `json:"talent_loadout_code" validate:"nonnil,min=1"`
	SelectedClassTalentTree struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
	} `json:"selected_class_talent_tree"`
	SelectedHeroTalentTree struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
	} `json:"selected_hero_talent_tree"`
	SelectedSpecTalentTree struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"selected_spec_talent_tree"`
	IsActive bool `json:"is_active"`
}

type talentJson struct {
	Tooltip tooltipJson `json:"tooltip"`
	Id      int         `json:"id"`
	Rank    int         `json:"rank"`
}

type charaterJson struct {
	Key   keyJson       `json:"key"`
	Name  string        `json:"name"`
	Realm realmLinkJson `json:"realm"`
	Id    int           `json:"id"`
}

type realmLinkJson struct {
	Key  keyJson `json:"key"`
	Name string  `json:"name"`
	Slug string  `json:"slug"`
	Id   int     `json:"id"`
}

type keyJson struct {
	Href string `json:"href"`
}

type loadoutScanOptions struct {
	OverrideSpec string
	Region       bnet.Region
}

type LoadoutScanOption interface {
	apply(*loadoutScanOptions)
}

type regionOption bnet.Region

func (r regionOption) apply(options *loadoutScanOptions) {
	options.Region = bnet.Region(r)
}

type overrideSpecOption string

func (o overrideSpecOption) apply(options *loadoutScanOptions) {
	options.OverrideSpec = string(o)
}

func WithRegion(region bnet.Region) LoadoutScanOption {
	return regionOption(region)
}

func WithOverrideSpec(spec string) LoadoutScanOption {
	return overrideSpecOption(spec)
}

func GetPlayerLoadouts(scanner *scan.Scanner, players []wow.PlayerLink, opts ...LoadoutScanOption) ([]LoadoutResponse, error) {
	scanOptions := loadoutScanOptions{
		OverrideSpec: "",
		Region:       bnet.RegionUS,
	}
	for _, opt := range opts {
		opt.apply(&scanOptions)
	}

	requests := make(chan bnet.Request, len(players))
	results := make(chan scan.ScanResult[specializationsJson], len(players))
	options := scan.ScanOptions[specializationsJson]{
		Validator: validate.NewTagValidator[specializationsJson](),
		Lifespan:  time.Hour * 18,
		Repairs:   getRepairs(scanOptions),
	}

	scan.Scan(scanner, requests, results, &options)
	for _, player := range players {
		requests <- bnet.Request{
			Region:    scanOptions.Region,
			Namespace: bnet.NamespaceProfile,
			Path:      player.SpecializationUrl(),
		}
	}
	close(requests)

	loadouts := make([]LoadoutResponse, len(players))
	for i := 0; i < len(loadouts); i++ {
		result := <-results
		log.Printf("Retrieved player loadout: %v", result.ApiRequest.Path)
		if result.Error != nil {
			path := result.ApiRequest.Path
			loadouts[result.Index].Error = result.Error
			log.Printf("Failed to retrieve player loadout (%s): %v", path, result.Error)
			continue
		}

		loadout, err := activeLoadoutFromSpecializationsJson(&result.Response, &scanOptions)
		loadouts[result.Index].Loadout = loadout
		loadouts[result.Index].Error = err
		if err != nil {
			path := result.ApiRequest.Path
			log.Printf("Failed to parse player loadout json (%s): %v", path, err)
			continue
		}
	}

	return loadouts, nil
}

func activeLoadoutFromSpecializationsJson(inputJson *specializationsJson, config *loadoutScanOptions) (wow.Loadout, error) {
	activeSpec := inputJson.ActiveSpecialization.Name
	if config.OverrideSpec != "" {
		activeSpec = config.OverrideSpec
	}

	for _, specializationJson := range inputJson.Specializations {
		if specializationJson.Specialization.Name != activeSpec {
			continue
		}

		for _, loadoutJson := range specializationJson.Loadouts {
			if loadoutJson.IsActive {
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

	specNodes := make([]wow.LoadoutNode, len(inputJson.SelectedSpecTalents))
	for i, talent := range inputJson.SelectedSpecTalents {
		specNodes[i] = parseNode(talent)
	}

	heroNodes := make([]wow.LoadoutNode, len(inputJson.SelectedHeroTalents))
	for i, talent := range inputJson.SelectedHeroTalents {
		heroNodes[i] = parseNode(talent)
	}

	return wow.Loadout{
		ClassName:  inputJson.SelectedClassTalentTree.Name,
		SpecName:   inputJson.SelectedSpecTalentTree.Name,
		ClassNodes: classNodes,
		SpecNodes:  specNodes,
		HeroNodes:  heroNodes,
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
