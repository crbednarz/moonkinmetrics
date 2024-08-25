package wow

type Loadout struct {
	ClassName  string
	SpecName   string
	ClassNodes []LoadoutNode
	SpecNodes  []LoadoutNode
	PvpTalents []LoadoutPvpTalent
	Code       string
}

type LoadoutNode struct {
	TalentName string
	NodeId     int
	TalentId   int
	Rank       int
}

type LoadoutPvpTalent struct {
	Id int
}
