package players

import (
	"fmt"
	"strings"
	"testing"

	"github.com/crbednarz/moonkinmetrics/pkg/testutils"
	"github.com/crbednarz/moonkinmetrics/pkg/wow"
	"github.com/stretchr/testify/require"
)

func realmJsonFromDetails(id int, name string, slug string) string {
	return fmt.Sprintf(`{
    "name": "%s",
    "slug": "%s",
    "id": %d
  }`, name, slug, id)
}

func TestCanGetRealms(t *testing.T) {
	scanner, err := testutils.NewMockScanner(func(requestPath string) (string, bool) {
		if strings.HasPrefix(requestPath, "/data/wow/realm/") {
			id := strings.TrimPrefix(requestPath, "/data/wow/realm/")
			switch id {
			case "129":
				return realmJsonFromDetails(129, "Gurubashi", "gurubashi"), true
			case "131":
				return realmJsonFromDetails(131, "Skywall", "skywall"), true
			case "66":
				return realmJsonFromDetails(66, "Dalaran", "dalaran"), true
			}
		}
		return "", false
	})
	require.NoError(t, err)

	realms, err := GetRealms(scanner, []wow.RealmLink{
		{Url: "https://us.api.blizzard.com/data/wow/realm/129?namespace=dynamic-us", Slug: "gurubashi"},
		{Url: "https://us.api.blizzard.com/data/wow/realm/131?namespace=dynamic-us", Slug: "skywall"},
		{Url: "https://us.api.blizzard.com/data/wow/realm/66?namespace=dynamic-us", Slug: "dalaran"},
	})
	require.NoError(t, err)

	require.Equal(t, len(realms), 3, "expected 3 realms")
	require.Contains(t, realms, wow.Realm{Name: "Gurubashi", Slug: "gurubashi", Id: 129})
	require.Contains(t, realms, wow.Realm{Name: "Skywall", Slug: "skywall", Id: 131})
	require.Contains(t, realms, wow.Realm{Name: "Dalaran", Slug: "dalaran", Id: 66})
}
