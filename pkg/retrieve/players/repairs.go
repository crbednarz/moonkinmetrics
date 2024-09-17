package players

import "github.com/crbednarz/moonkinmetrics/pkg/scan"

type unusedRemover struct {
	OverrideSpec string
}

func (r *unusedRemover) Process(s *specializationsJson) error {
	targetSpecName := r.OverrideSpec
	if targetSpecName == "" {
		targetSpecName = s.ActiveSpecialization.Name
	}

	var targetSpec *specializationJson
	for i := range s.Specializations {
		spec := &s.Specializations[i]
		if spec.Specialization.Name == targetSpecName {
			targetSpec = spec
			break
		}
	}

	if targetSpec != nil {
		var targetLoadout *loadoutJson
		for i := range targetSpec.Loadouts {
			if targetSpec.Loadouts[i].IsActive {
				targetLoadout = &targetSpec.Loadouts[i]
				break
			}
		}
		if targetLoadout != nil {
			targetSpec.Loadouts = []loadoutJson{*targetLoadout}
			s.Specializations = []specializationJson{*targetSpec}
		}
	}

	return nil
}

func removePartialTalents(s *specializationsJson) error {
	for specIndex := range s.Specializations {
		spec := &s.Specializations[specIndex]
		for loadoutIndex := range spec.Loadouts {
			loadout := &spec.Loadouts[loadoutIndex]
			if len(loadout.SelectedClassTalents) == 0 {
				continue
			}

			classTalents := make([]talentJson, 0, len(loadout.SelectedClassTalents))
			for _, talent := range loadout.SelectedClassTalents {
				if talent.Tooltip.SpellTooltip.Spell.Id != 0 {
					classTalents = append(classTalents, talent)
				}
			}
			loadout.SelectedClassTalents = classTalents

			specTalents := make([]talentJson, 0, len(loadout.SelectedSpecTalents))
			for _, talent := range loadout.SelectedSpecTalents {
				if talent.Tooltip.SpellTooltip.Spell.Id != 0 {
					specTalents = append(specTalents, talent)
				}
			}
			loadout.SelectedSpecTalents = specTalents
		}
	}
	return nil
}

func getRepairs(config loadoutScanOptions) []scan.ResultProcessor[specializationsJson] {
	return []scan.ResultProcessor[specializationsJson]{
		&unusedRemover{OverrideSpec: config.OverrideSpec},
		scan.NewResultProcessor(removePartialTalents),
	}
}
