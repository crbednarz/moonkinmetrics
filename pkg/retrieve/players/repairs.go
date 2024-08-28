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
	for _, spec := range s.Specializations {
		if spec.Specialization.Name == targetSpecName {
			targetSpec = &spec
			break
		}
	}

	if targetSpec != nil {
		s.Specializations = []specializationJson{*targetSpec}
	}

	return nil
}

func getRepairs(config LoadoutScanOptions) []repair.Repairer[specializationsJson] {
	return []repair.Repairer[specializationsJson]{
		&unusedSpecRemover{OverrideSpec: config.OverrideSpec},
	}
}
