import fs from 'fs';
import path from 'path';

interface Dimensions {
  width: number;
  height: number;
}

export interface Talent {
  id: number;
  name: string;
  spellId: number;
  spellName: string;
  icon: string;
  ranks: Rank[];
}

export interface Rank {
  description: string;
  castTime?: string;
  powerCost?: string;
  range?: string;
  cooldown?: string;
}

export interface TalentNode {
  id: number;
  row: number;
  column: number;
  x: number;
  y: number;
  unlocks: number[];
  lockedBy: number[];
  maxRank: number;
  talents: Talent[];
  nodeType: string;
}

export interface TalentTree {
  className: string;
  classId: number;
  specName: string;
  specId: number;
  classSize: Dimensions;
  specSize: Dimensions;
  classNodes: TalentNode[];
  specNodes: TalentNode[];
  pvpTalents: Talent[];
}

function deserializeNode(jsonNode: any) {
  return {
    id: jsonNode['id'],
    row: jsonNode['row'],
    column: jsonNode['col'],
    x: jsonNode['x'],
    y: jsonNode['y'],
    unlocks: jsonNode['unlocks'],
    lockedBy: jsonNode['locked_by'],
    maxRank: jsonNode['max_rank'],
    talents: jsonNode['talents'].map(deserializeTalent),
    nodeType: jsonNode['node_type'],
  }
}

function deserializeTalent(jsonTalent: any) {
  return {
    id: jsonTalent['id'],
    name: jsonTalent['name'],
    spellId: jsonTalent['spell']['id'],
    spellName: jsonTalent['spell']['name'],
    icon: jsonTalent['icon'],
    ranks: jsonTalent['spell']['ranks'].map((jsonRank: any) => ({
      description: jsonRank['description'],
      castTime: jsonRank['cast_time'] ?? null,
      powerCost: jsonRank['power_cost'] ?? null,
      range: jsonRank['range'] ?? null,
      cooldown: jsonRank['cooldown'] ?? null,
    })),
  }
}

const wowDirectory = path.join(process.cwd(), 'wow');

export function getTalentTree(className: string, specName: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'talents', fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const jsonTree = JSON.parse(fileContents);


  let classNodes = jsonTree['class_nodes'].map(deserializeNode);
  let specNodes = jsonTree['spec_nodes'].map(deserializeNode);


  const iconSize = 56;
  const iconPadding = 23;
  const paddedIconSize = iconSize + iconPadding * 2;
  const iconRows = 10;
  const iconCols = 9;

  // Tree width has an additional 0.5 columns to accommodate choice talents expanding.
  const width = paddedIconSize * (iconCols + 0.5);
  const height = paddedIconSize * iconRows;

  const tree: TalentTree = {
    className: jsonTree['class_name'],
    classId: jsonTree['class_id'],
    specName: jsonTree['spec_name'],
    specId: jsonTree['spec_id'],
    classNodes,
    specNodes,
    pvpTalents: jsonTree['pvp_talents'].map(deserializeTalent),
    classSize: {width, height},
    specSize: {width, height},
  }

  return tree;
}
