CURRENT_PVP_SEASON = 38

CLASS_NAMES = [
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
]


INGAME_SPEC_NODES = {}


SPEC_BY_CLASS = {
    "Hunter": [
        "Beast Mastery",
        "Survival",
        "Marksmanship",
    ],
    "Shaman": [
        "Elemental",
        "Enhancement",
        "Restoration",
    ],
    "Druid": [
        "Guardian",
        "Feral",
        "Balance",
        "Restoration",
    ],
    "Warrior": [
        "Fury",
        "Arms",
        "Protection",
    ],
    "Monk": [
        "Windwalker",
        "Brewmaster",
        "Mistweaver",
    ],
    "Evoker": [
        "Preservation",
        "Devastation",
        "Augmentation",
    ],
    "Death Knight": [
        "Frost",
        "Unholy",
        "Blood",
    ],
    "Paladin": [
        "Holy",
        "Protection",
        "Retribution",
    ],
    "Priest": [
        "Discipline",
        "Shadow",
        "Holy",
    ],
    "Mage": [
        "Arcane",
        "Fire",
        "Frost",
    ],
    "Rogue": [
        "Subtlety",
        "Assassination",
        "Outlaw",
    ],
    "Demon Hunter": [
        "Havoc",
        "Vengeance",
    ],
    "Warlock": [
        "Destruction",
        "Demonology",
        "Affliction",
    ],
}

CLASS_SPEC_BY_SPEC_ID = {
    254: ("Hunter", "Marksmanship"),
    255: ("Hunter", "Survival"),
    253: ("Hunter", "Beast Mastery"),
    262: ("Shaman", "Elemental"),
    264: ("Shaman", "Restoration"),
    263: ("Shaman", "Enhancement"),
    102: ("Druid", "Balance"),
    103: ("Druid", "Feral"),
    104: ("Druid", "Guardian"),
    105: ("Druid", "Restoration"),
    71: ("Warrior", "Arms"),
    72: ("Warrior", "Fury"),
    73: ("Warrior", "Protection"),
    269: ("Monk", "Windwalker"),
    268: ("Monk", "Brewmaster"),
    270: ("Monk", "Mistweaver"),
    1468: ("Evoker", "Preservation"),
    1467: ("Evoker", "Devastation"),
    1473: ("Evoker", "Augmentation"),
    250: ("Death Knight", "Blood"),
    252: ("Death Knight", "Unholy"),
    251: ("Death Knight", "Frost"),
    66: ("Paladin", "Protection"),
    65: ("Paladin", "Holy"),
    70: ("Paladin", "Retribution"),
    257: ("Priest", "Holy"),
    256: ("Priest", "Discipline"),
    258: ("Priest", "Shadow"),
    64: ("Mage", "Frost"),
    63: ("Mage", "Fire"),
    62: ("Mage", "Arcane"),
    260: ("Rogue", "Outlaw"),
    259: ("Rogue", "Assassination"),
    261: ("Rogue", "Subtlety"),
    581: ("Demon Hunter", "Vengeance"),
    577: ("Demon Hunter", "Havoc"),
    265: ("Warlock", "Affliction"),
    266: ("Warlock", "Demonology"),
    267: ("Warlock", "Destruction"),
}

SPEC_ID_BY_CLASS_SPEC = {v: k for k, v in CLASS_SPEC_BY_SPEC_ID.items()}


def _get_class_specs():
    class_specs = []
    for class_name, specs in SPEC_BY_CLASS.items():
        for spec_name in specs:
            class_specs.append((class_name, spec_name))
    return class_specs


CLASS_SPECS = _get_class_specs()
