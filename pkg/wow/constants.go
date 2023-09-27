package wow

var ClassNames = []string{
	"Hunter",
	"Shaman",
	"Druid",
	"Warrior",
	"Monk",
	"Evoker",
	"Death Knight",
	"Paladin",
	"Priest",
	"Mage",
	"Rogue",
	"Demon Hunter",
	"Warlock",
}

var SpecByClass = map[string][]string{
	"Hunter": {
		"Beast Mastery",
		"Survival",
		"Marksmanship",
	},
	"Shaman": {
		"Elemental",
		"Enhancement",
		"Restoration",
	},
	"Druid": {
		"Guardian",
		"Feral",
		"Balance",
		"Restoration",
	},
	"Warrior": {
		"Fury",
		"Arms",
		"Protection",
	},
	"Monk": {
		"Windwalker",
		"Brewmaster",
		"Mistweaver",
	},
	"Evoker": {
		"Preservation",
		"Devastation",
		"Augmentation",
	},
	"Death Knight": {
		"Frost",
		"Unholy",
		"Blood",
	},
	"Paladin": {
		"Holy",
		"Protection",
		"Retribution",
	},
	"Priest": {
		"Discipline",
		"Shadow",
		"Holy",
	},
	"Mage": {
		"Arcane",
		"Fire",
		"Frost",
	},
	"Rogue": {
		"Subtlety",
		"Assassination",
		"Outlaw",
	},
	"Demon Hunter": {
		"Havoc",
		"Vengeance",
	},
	"Warlock": {
		"Destruction",
		"Demonology",
		"Affliction",
	},
}
