CURRENT_PVP_SEASON = 34

CLASS_NAMES = [
    'Hunter',
    'Shaman',
    'Druid',
    'Warrior',
    'Monk',
    'Evoker',
    'Death Knight',
    'Paladin',
    'Priest',
    'Mage',
    'Rogue',
    'Demon Hunter',
    'Warlock',
]

SPEC_BY_CLASS = {
    'Hunter': [
        'Beast Mastery',
        'Survival',
        'Marksmanship',
    ],
    'Shaman': [
        'Elemental',
        'Enhancement',
        'Restoration',
    ],
    'Druid': [
        'Guardian',
        'Feral',
        'Balance',
        'Restoration',
    ],
    'Warrior': [
        'Fury',
        'Arms',
        'Protection',
    ],
    'Monk': [
        'Windwalker',
        'Brewmaster',
        'Mistweaver',
    ],
    'Evoker': [
        'Preservation',
        'Devastation',
    ],
    'Death Knight': [
        'Frost',
        'Unholy',
        'Blood',
    ],
    'Paladin': [
        'Holy',
        'Protection',
        'Retribution',
    ],
    'Priest': [
        'Discipline',
        'Shadow',
        'Holy',
    ],
    'Mage': [
        'Arcane',
        'Fire',
        'Frost',
    ],
    'Rogue': [
        'Subtlety',
        'Assassination',
        'Outlaw',
    ],
    'Demon Hunter': [
        'Havoc',
        'Vengeance',
    ],
    'Warlock': [
        'Destruction',
        'Demonology',
        'Affliction',
    ]
}


def _get_class_specs():
    class_specs = []
    for class_name, specs in SPEC_BY_CLASS.items():
        for spec_name in specs:
            class_specs.append((class_name, spec_name))
    return class_specs


CLASS_SPECS = _get_class_specs()
