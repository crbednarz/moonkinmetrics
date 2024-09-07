package testutils

import (
	"embed"
	"fmt"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/scan"
)

//go:embed testdata
var testdata embed.FS

//go:embed testdata/data/wow/pvp-talent/5599
var pvpTalentJson string

//go:embed testdata/data/wow/talent/108105
var talentJson string

func NewMockTalentScanner() (*scan.Scanner, error) {
	return NewMockScanner(func(requestPath string) (string, bool) {
		data, err := testdata.ReadFile("testdata" + requestPath)
		if err == nil {
			return string(data), true
		}

		if strings.HasPrefix(requestPath, "/data/wow/media/spell/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/media/spell/")
			return MockSpellMediaJson(id), true
		}

		if strings.HasPrefix(requestPath, "/data/wow/talent/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/talent/")
			return strings.ReplaceAll(talentJson, "108105", id), true
		}

		if strings.HasPrefix(requestPath, "/data/wow/pvp-talent/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/pvp-talent/")
			return strings.ReplaceAll(pvpTalentJson, "5599", id), true
		}

		return "", false
	})
}

func MockSpellMediaJson(id string) string {
	return fmt.Sprintf(`{
    "_links": {
      "self": {
        "href": "https://us.api.blizzard.com/data/wow/media/spell/%[1]v?namespace=static-11.0.2_55938-us"
      }
    },
    "assets": [
      {
        "key": "icon",
        "value": "%[1]v",
        "file_data_id": %[1]v
      }
    ],
    "id": %[1]v
  }`, id)
}
