package cli

import (
	"fmt"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/wow"
)

func ExpandBracketArg(arg string) []string {
	brackets := []string{arg}
	if arg == "shuffle" || arg == "blitz" {
		brackets = make([]string, 0, len(wow.SpecByClass)*3)
		for class, specs := range wow.SpecByClass {
			classSlug := strings.ReplaceAll(class, " ", "")
			for _, spec := range specs {
				specSlug := strings.ReplaceAll(spec, " ", "")
				slug := strings.ToLower(fmt.Sprintf("%s-%s-%s", arg, classSlug, specSlug))
				brackets = append(brackets, slug)
			}
		}
	}
	return brackets
}
