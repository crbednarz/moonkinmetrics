package wow

import (
	"fmt"
	"strings"

	"github.com/crbednarz/moonkinmetrics/pkg/bnet"
)

type Leaderboard struct {
	Bracket string
	Region  bnet.Region
	Entries []LeaderboardEntry
}

type LeaderboardEntry struct {
	Player  PlayerLink
	Faction string
	Rating  uint
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

func (l *Leaderboard) GetUniqueRealms() []RealmLink {
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

func (l *Leaderboard) FilterByMinRating(minRating uint) Leaderboard {
	entries := make([]LeaderboardEntry, 0, len(l.Entries))

	for i := range l.Entries {
		if l.Entries[i].Rating >= minRating {
			entries = append(entries, l.Entries[i])
		}
	}

	return Leaderboard{
		Bracket: l.Bracket,
		Region:  l.Region,
		Entries: entries,
	}
}
