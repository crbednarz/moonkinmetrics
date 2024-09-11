package players

import (
	"github.com/crbednarz/moonkinmetrics/pkg/repair"
)

type unusedSpecRemover struct {
	OverrideSpec string
}

func (r *unusedSpecRemover) Repair(s *specializationsJson) error {
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
		s.Specializations = []specializationJson{*targetSpec}
	}

	return nil
}

// removeBadFirstTalent removes the first class talent if the spell id is 0.
// Occasionally, the first class talent returns with no details other than an id and rank.
// It's easier to remove the talent than to try to repair it.
func removeBadFirstTalent(s *specializationsJson) error {
	for specIndex := range s.Specializations {
		spec := &s.Specializations[specIndex]
		for loadoutIndex := range spec.Loadouts {
			loadout := &spec.Loadouts[loadoutIndex]
			if len(loadout.SelectedClassTalents) == 0 {
				continue
			}
			if loadout.SelectedClassTalents[0].Tooltip.SpellTooltip.Spell.Id == 0 {
				loadout.SelectedClassTalents = loadout.SelectedClassTalents[1:]
			}
		}
	}
	return nil
}

func getRepairs(config LoadoutScanOptions) []repair.Repairer[specializationsJson] {
	return []repair.Repairer[specializationsJson]{
		&unusedSpecRemover{OverrideSpec: config.OverrideSpec},
		repair.NewRepair(removeBadFirstTalent),
	}
}