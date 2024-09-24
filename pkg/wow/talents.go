package wow

type Rank struct {
	Name        string
	Description string
	CastTime    string
	PowerCost   string
	Range       string
	Cooldown    string
}

type Spell struct {
	Name  string
	Ranks []Rank
	Id    int
}

type Talent struct {
	Name  string
	Icon  string
	Spell Spell
	Id    int
}

type TalentNode struct {
	NodeType string
	Unlocks  []int
	LockedBy []int
	Talents  []Talent
	Id       int
	X        int
	Y        int
	Row      int
	Col      int
	MaxRank  int
}

type HeroTree struct {
	Name  string
	Icon  string
	Nodes []TalentNode
	Id    int
}

type TalentTree struct {
	ClassName  string
	SpecName   string
	ClassNodes []TalentNode
	SpecNodes  []TalentNode
	HeroTrees  []HeroTree
	PvpTalents []Talent
	ClassId    int
	SpecId     int
}
