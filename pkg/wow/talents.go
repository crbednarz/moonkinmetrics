package wow

type Rank struct {
	Id          int
	Name        string
	Description string
	CastTime    string
	PowerCost   string
	Range       string
	Cooldown    string
}

type Spell struct {
	Id    int
	Name  string
	Ranks []Rank
}

type Talent struct {
	Id    int
	Name  string
	Spell Spell
}

type TalentNode struct {
	Id       int
	X        int
	Y        int
	Row      int
	Col      int
	Unlocks  []int
	LockedBy []int
	Talents  []Talent
	MaxRank  int
	NodeType string
}

type TalentTree struct {
	ClassName  string
	ClassId    int
	SpecName   string
	SpecId     int
	ClassNodes []TalentNode
	SpecNodes  []TalentNode
	PvpTalents []Talent
}
