package wow

type Leaderboard struct {
	Entries []LeaderboardEntry
}

type LeaderboardEntry struct {
	Name    string
	Realm   RealmLink
	Faction string
	Rating  int
}

type RealmLink struct {
	Slug string
	Url  string
}
