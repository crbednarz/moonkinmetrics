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

type Realm struct {
	Name string
	Slug string
	Id   int
}

func (p PlayerLink) SpecializationUrl() string {
	return fmt.Sprintf("/profile/wow/character/%s/%s/specializations", p.Realm.Slug, strings.ToLower(p.Name))
}

func (l Leaderboard) GetUniqueRealms() []RealmLink {
	realmLinkMap := make(map[string]RealmLink)

	for i := range l.Entries {
		realm := l.Entries[i].Player.Realm
		if _, ok := realmLinkMap[realm.Slug]; !ok {
			realmLinkMap[realm.Slug] = realm
		}
	}

	realmLinks := make([]RealmLink, 0, len(realmLinkMap))
	for _, realm := range realmLinkMap {
		realmLinks = append(realmLinks, realm)
	}

	return realmLinks
}
