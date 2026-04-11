package players

import (
	_ "embed"
	"fmt"
	"log"
	"time"

	"github.com/crbednarz/moonkinmetrics/pkg/api"
	"github.com/crbednarz/moonkinmetrics/pkg/scan"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

type LoadoutResponse struct {
	Error   error
	Loadout wow.Loadout
}

type specializationsJson struct {
	Specializations      []specializationJson `json:"specializations"`
	ActiveSpecialization struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"active_specialization"`
	Character characterJson `json:"character"`
}

type specializationJson struct {
	Specialization struct {
		Name string  `json:"name"`
		Key  keyJson `json:"key"`
		Id   int     `json:"id"`
	} `json:"specialization"`
	PvpTalentSlots []pvpTalentSlotJson `json:"pvp_talent_slots"`
	Loadouts       []loadoutJson       `json:"loadouts"`
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
	SelectedClassTalents    []talentJson `json:"selected_class_talents"`
	SelectedSpecTalents     []talentJson `json:"selected_spec_talents"`
	SelectedHeroTalents     []talentJson `json:"selected_hero_talents"`
	TalentLoadoutCode       string       `json:"talent_loadout_code"`
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

type characterJson struct {
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
	Region       api.Region
}

type LoadoutScanOption interface {
	apply(*loadoutScanOptions)
}

type regionOption api.Region

func (r regionOption) apply(options *loadoutScanOptions) {
	options.Region = api.Region(r)
}

type overrideSpecOption string

func (o overrideSpecOption) apply(options *loadoutScanOptions) {
	options.OverrideSpec = string(o)
}

func WithRegion(region api.Region) LoadoutScanOption {
	return regionOption(region)
}

func WithOverrideSpec(spec string) LoadoutScanOption {
	return overrideSpecOption(spec)
}

func GetPlayerLoadouts(scanner *scan.Scanner, players []wow.PlayerLink, opts ...LoadoutScanOption) ([]LoadoutResponse, error) {
	scanOptions := &loadoutScanOptions{
		OverrideSpec: "",
		Region:       api.RegionUS,
	}
	for _, opt := range opts {
		opt.apply(scanOptions)
	}

	requests := make(chan api.Request, len(players))
	results := make(chan scan.ScanResult[specializationsJson], len(players))
	options := scan.ScanOptions[specializationsJson]{
		Validator: &specializationsValidator{},
		Lifespan:  time.Hour * 18,
		Repairs:   getRepairs(*scanOptions),
	}

	scan.Scan(scanner, requests, results, &options)
	for _, player := range players {
		requests <- &api.BnetRequest{
			Region:    scanOptions.Region,
			Namespace: api.NamespaceProfile,
			Path:      player.SpecializationUrl(),
		}
	}
	close(requests)

	loadouts := make([]LoadoutResponse, len(players))
	for i := 0; i < len(loadouts); i++ {
		result := <-results
		log.Printf("Retrieved player loadout: %v", result.ApiRequest.Id())
		if result.Error != nil {
			id := result.ApiRequest.Id()
			loadouts[result.Index].Error = result.Error
			log.Printf("Failed to retrieve player loadout (%s): %v", id, result.Error)
			continue
		}

		loadout, err := activeLoadoutFromSpecializationsJson(&result.Response, scanOptions)

		loadouts[result.Index].Loadout = loadout
		loadouts[result.Index].Error = err
		if err != nil {
			id := result.ApiRequest.Id()
			log.Printf("Failed to parse player loadout json (%s): %v", id, err)
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

type specializationsValidator struct{}

func (s *specializationsValidator) IsValid(specs *specializationsJson) error {
	return validateSpecializationsJson(specs)
}

func validateSpecializationsJson(specs *specializationsJson) error {
	if len(specs.Specializations) == 0 {
		return fmt.Errorf("specs.Specializations cannot be empty or nil")
	}

	for i := range specs.Specializations {
		err := validateSpecializationJson(&specs.Specializations[i])
		if err != nil {
			return err
		}
	}
	return nil
}

func validateSpecializationJson(spec *specializationJson) error {
	if len(spec.PvpTalentSlots) == 0 {
		return fmt.Errorf("spec.PvpTalentSlots cannot be empty or nil")
	}

	if len(spec.Loadouts) == 0 {
		return fmt.Errorf("spec.Loadouts cannot be empty or nil")
	}

	for i := range spec.Loadouts {
		err := validateLoadoutJson(&spec.Loadouts[i])
		if err != nil {
			return err
		}
	}

	return nil
}

func validateLoadoutJson(loadout *loadoutJson) error {
	if len(loadout.SelectedClassTalents) == 0 {
		return fmt.Errorf("loadout.SelectedClassTalents cannot be empty or nil")
	}

	if len(loadout.SelectedSpecTalents) == 0 {
		return fmt.Errorf("loadout.SelectedSpecTalents cannot be empty or nil")
	}

	if len(loadout.SelectedHeroTalents) == 0 {
		return fmt.Errorf("loadout.SelectedHeroTalents cannot be empty or nil")
	}
	if len(loadout.TalentLoadoutCode) == 0 {
		return fmt.Errorf("loadout.TalentLoadoutCode cannot be empty or nil")
	}
	return nil
}
