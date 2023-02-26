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

SPEC_NODE_IDS = {
    'Druid': {
        'Restoration': [
            82043, 82044, 82045, 82046,
            82047, 82048, 82049, 82050,
            82051, 82052, 82053, 82054,
            82055, 82056, 82057, 82058,
            82059, 82060, 82061, 82062,
            82063, 82064, 82065, 82066,
            82067, 82068, 82069, 82070,
            82071, 82072, 82073, 82074,
            82075, 82076, 82077, 82078,
            82079, 82080, 82081, 82082,
            82083, 82084, 82197, 82198,
            82199, 82200, 82203, 82206,
            82207, 82208, 82209, 82210,
            82211, 82213, 82214, 82216,
            82217, 82218, 82219, 82220,
            82221, 82222, 82223, 82224,
            82225, 82226, 82227, 82228,
            82229, 82230, 82231, 82232,
            82233, 82234, 82235, 82236,
            82237, 82238, 82239, 82240,
            82241, 82242, 82243, 82244,
            82245, 82246, 91040, 91042,
            92228, 92229, 92609
        ],
        'Guardian': [
            82125, 82126, 82127, 82128,
            82129, 82130, 82131, 82132,
            82133, 82134, 82135, 82136,
            82137, 82138, 82139, 82140,
            82141, 82142, 82143, 82144,
            82145, 82146, 82147, 82148,
            82149, 82151, 82152, 82153,
            82154, 82155, 82156, 82157,
            82158, 82159, 82160, 82161,
            82162, 82197, 82198, 82199,
            82200, 82206, 82207, 82208,
            82209, 82210, 82211, 82213,
            82214, 82215, 82216, 82217,
            82218, 82219, 82220, 82221,
            82222, 82223, 82224, 82225,
            82226, 82227, 82228, 82229,
            82230, 82231, 82232, 82233,
            82234, 82235, 82236, 82237,
            82238, 82239, 82240, 82241,
            82242, 82243, 82244, 82245,
            82246, 91041, 91043, 92226,
            92227, 92228, 92229, 92585,
            92586, 92587, 92588
        ],
    },
    'Warrior': {
        'Arms': [
            90266, 90267, 90269, 90270,
            90271, 90272, 90273, 90274,
            90275, 90276, 90277, 90278,
            90279, 90280, 90281, 90282,
            90283, 90284, 90285, 90286,
            90287, 90288, 90289, 90290,
            90291, 90292, 90293, 90294,
            90321, 90322, 90323, 90326,
            90327, 90328, 90329, 90331,
            90332, 90333, 90336, 90337,
            90338, 90340, 90341, 90342,
            90344, 90346, 90347, 90348,
            90351, 90352, 90353, 90354,
            90355, 90356, 90357, 90358,
            90359, 90360, 90363, 90365,
            90366, 90368, 90371, 90372,
            90374, 90375, 90378, 90379,
            90380, 90381, 90382, 90383,
            90384, 90385, 90437, 90438,
            90439, 90440, 90441, 90442,
            90444, 90445, 90446, 90447,
            92221, 92224, 92535, 92536,
            92537, 92614, 92615
        ],
        'Protection': [
            90259, 90260, 90261, 90262,
            90264, 90265, 90295, 90296,
            90297, 90298, 90299, 90300,
            90301, 90302, 90303, 90304,
            90305, 90306, 90307, 90308,
            90309, 90310, 90311, 90312,
            90313, 90314, 90315, 90316,
            90317, 90318, 90319, 90320,
            90321, 90323, 90324, 90326,
            90329, 90330, 90331, 90332,
            90334, 90336, 90337, 90339,
            90340, 90341, 90342, 90343,
            90344, 90345, 90346, 90348,
            90351, 90353, 90355, 90356,
            90357, 90358, 90359, 90360,
            90361, 90364, 90368, 90369,
            90370, 90371, 90372, 90374,
            90375, 90377, 90378, 90379,
            90380, 90381, 90382, 90383,
            90384, 90385, 90431, 90432,
            90433, 90434, 90435, 90448,
            90449, 90450, 90451, 90452,
            92639
        ],
    },
}


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

CLASS_SPEC_BY_SPEC_ID = {
    254: ('Hunter', 'Marksmanship'),
    255: ('Hunter', 'Survival'),
    253: ('Hunter', 'Beast Mastery'),
    262: ('Shaman', 'Elemental'),
    264: ('Shaman', 'Restoration'),
    263: ('Shaman', 'Enhancement'),
    102: ('Druid', 'Balance'),
    103: ('Druid', 'Feral'),
    104: ('Druid', 'Guardian'),
    105: ('Druid', 'Restoration'),
    71: ('Warrior', 'Arms'),
    72: ('Warrior', 'Fury'),
    73: ('Warrior', 'Protection'),
    269: ('Monk', 'Windwalker'),
    268: ('Monk', 'Brewmaster'),
    270: ('Monk', 'Mistweaver'),
    1468: ('Evoker', 'Preservation'),
    1467: ('Evoker', 'Devastation'),
    250: ('Death Knight', 'Blood'),
    252: ('Death Knight', 'Unholy'),
    251: ('Death Knight', 'Frost'),
    66: ('Paladin', 'Protection'),
    65: ('Paladin', 'Holy'),
    70: ('Paladin', 'Retribution'),
    257: ('Priest', 'Holy'),
    256: ('Priest', 'Discipline'),
    258: ('Priest', 'Shadow'),
    64: ('Mage', 'Frost'),
    63: ('Mage', 'Fire'),
    62: ('Mage', 'Arcane'),
    260: ('Rogue', 'Outlaw'),
    259: ('Rogue', 'Assassination'),
    261: ('Rogue', 'Subtlety'),
    581: ('Demon Hunter', 'Vengeance'),
    577: ('Demon Hunter', 'Havoc'),
    265: ('Warlock', 'Affliction'),
    266: ('Warlock', 'Demonology'),
    267: ('Warlock', 'Destruction'),
}


def _get_class_specs():
    class_specs = []
    for class_name, specs in SPEC_BY_CLASS.items():
        for spec_name in specs:
            class_specs.append((class_name, spec_name))
    return class_specs


CLASS_SPECS = _get_class_specs()
