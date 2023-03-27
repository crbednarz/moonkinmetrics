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
  specName: string;
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

function convertNodePositions(nodes: TalentNode[]) {
  let minX = nodes[0].x;
  let minY = nodes[0].y;
  let maxX = minX;
  let maxY = minY;

  for (let node of nodes) {
    minX = Math.min(node.x, minX);
    minY = Math.min(node.y, minY);
    maxX = Math.max(node.x, maxX);
    maxY = Math.max(node.y, maxY);
  }
  const iconSize = 56;
  const iconPadding = 24;
  const paddedIconSize = iconSize + iconPadding * 2;
  const blizzardIconSpacing = 600;
  const iconRows = 10;
  const iconCols = 9;

  // Tree width has an additional 0.5 columns to accommodate choice talents expanding.
  const width = paddedIconSize * (iconCols + 0.5);
  const height = paddedIconSize * iconRows;


  const xRange = maxX - minX;
  const yRange = maxY - minY;
  for (let node of nodes) {
    let x = node.x;
    let y = node.y;

    // Normalize positions
    x = (x - minX - xRange * 0.5) / blizzardIconSpacing;
    y = (y - minY - yRange * 0.5) / blizzardIconSpacing;

    // Center icons
    x = (x - 0.5) * paddedIconSize + iconPadding;
    y = (y - 0.5) * paddedIconSize + iconPadding;

    // Center with stage size
    x += width * 0.5;
    y += height * 0.5;

    node.x = x;
    node.y = y;
  }

  return {
    width,
    height
  };
}

const wowDirectory = path.join(process.cwd(), 'wow');

function validateNodes(nodes: TalentNode[]) {
  const ids = new Set<number>();
  for (let node of nodes) {
    ids.add(node.id);
  }

  return nodes.filter(node => {
    for (let lockedBy of node.lockedBy) {
      if (ids.has(lockedBy)) {
        return true;
      }
    }
    return node.lockedBy.length === 0;
  });
}

export function getTalentTree(className: string, specName: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'talents', fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const jsonTree = JSON.parse(fileContents);


  let classNodes = jsonTree['class_nodes'].map(deserializeNode);
  classNodes = validateNodes(classNodes);
  let specNodes = jsonTree['spec_nodes'].map(deserializeNode);
  specNodes = validateNodes(specNodes);


  const classSize = convertNodePositions(classNodes);
  const specSize = convertNodePositions(specNodes);
  const tree: TalentTree = {
    className: jsonTree['class_name'],
    specName: jsonTree['spec_name'],
    classNodes,
    specNodes,
    pvpTalents: jsonTree['pvp_talents'].map(deserializeTalent),
    classSize,
    specSize,
  }

  return tree;
}
