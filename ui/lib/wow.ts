class ClassSpec {
  constructor(
    readonly className: string,
    readonly specName: string,
  ) { }
}

export const SPEC_BY_CLASS: {[key: string]: string[]} = {
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
};

export const CLASS_SPECS: ClassSpec[] = [
  new ClassSpec('Hunter', 'Beast Mastery'),
  new ClassSpec('Hunter', 'Survival'),
  new ClassSpec('Hunter', 'Marksmanship'),
  new ClassSpec('Shaman', 'Elemental'),
  new ClassSpec('Shaman', 'Enhancement'),
  new ClassSpec('Shaman', 'Restoration'),
  new ClassSpec('Druid', 'Guardian'),
  new ClassSpec('Druid', 'Feral'),
  new ClassSpec('Druid', 'Balance'),
  new ClassSpec('Druid', 'Restoration'),
  new ClassSpec('Warrior', 'Fury'),
  new ClassSpec('Warrior', 'Arms'),
  new ClassSpec('Warrior', 'Protection'),
  new ClassSpec('Monk', 'Windwalker'),
  new ClassSpec('Monk', 'Brewmaster'),
  new ClassSpec('Monk', 'Mistweaver'),
  new ClassSpec('Evoker', 'Preservation'),
  new ClassSpec('Evoker', 'Devastation'),
  new ClassSpec('Death Knight', 'Frost'),
  new ClassSpec('Death Knight', 'Unholy'),
  new ClassSpec('Death Knight', 'Blood'),
  new ClassSpec('Paladin', 'Holy'),
  new ClassSpec('Paladin', 'Protection'),
  new ClassSpec('Paladin', 'Retribution'),
  new ClassSpec('Priest', 'Discipline'),
  new ClassSpec('Priest', 'Shadow'),
  new ClassSpec('Priest', 'Holy'),
  new ClassSpec('Mage', 'Arcane'),
  new ClassSpec('Mage', 'Fire'),
  new ClassSpec('Mage', 'Frost'),
  new ClassSpec('Rogue', 'Subtlety'),
  new ClassSpec('Rogue', 'Assassination'),
  new ClassSpec('Rogue', 'Outlaw'),
  new ClassSpec('Demon Hunter', 'Havoc'),
  new ClassSpec('Demon Hunter', 'Vengeance'),
  new ClassSpec('Warlock', 'Destruction'),
  new ClassSpec('Warlock', 'Demonology'),
  new ClassSpec('Warlock', 'Affliction'),
];
