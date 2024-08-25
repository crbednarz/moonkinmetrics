package wow

import (
	"fmt"
	"strings"
)

type Leaderboard struct {
	Entries []LeaderboardEntry
}

type LeaderboardEntry struct {
	Player  PlayerLink
	Faction string
	Rating  int
}

type PlayerLink struct {
	Name  string
	Realm RealmLink
}

type RealmLink struct {
	Slug string
	Url  string
}

func (p PlayerLink) SpecializationUrl() string {
	return fmt.Sprintf("/profile/wow/character/%s/%s/specializations", p.Realm.Slug, strings.ToLower(p.Name))
}
