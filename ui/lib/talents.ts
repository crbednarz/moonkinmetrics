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
}

export interface PvpTalent {
  id: number;
  spellId: number;
  spellName: string;
  icon: string;
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
  pvpTalents: PvpTalent[];
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
    talents: jsonNode['talents'].map((jsonTalent: any) => ({
      id: jsonTalent['id'],
      name: jsonTalent['name'],
      spellId: jsonTalent['spell']['id'],
      spellName: jsonTalent['spell']['name'],
      icon: jsonTalent['icon'],
    })),
    nodeType: jsonNode['node_type'],
  }
}

function deserializePvpTalent(jsonTalent: any) {
  return {
    id: jsonTalent['id'],
    spellId: jsonTalent['spell']['id'],
    spellName: jsonTalent['spell']['name'],
    icon: jsonTalent['icon'],
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
  const iconPadding = 14;
  const paddedIconSize = iconSize + iconPadding * 2;
  const blizzardIconSpacing = 600;
  const iconRows = 10;
  const iconCols = 9;

  const width = paddedIconSize * iconCols;
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

const wowDirectory = path.join(process.cwd(), 'wow')

export function getTalentTree(className: string, specName: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'talents', fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const jsonTree = JSON.parse(fileContents);


  const classNodes = jsonTree['class_nodes'].map(deserializeNode);
  const specNodes = jsonTree['spec_nodes'].map(deserializeNode);
  const classSize = convertNodePositions(classNodes);
  const specSize = convertNodePositions(specNodes);
  const tree: TalentTree = {
    className: jsonTree['class_name'],
    specName: jsonTree['spec_name'],
    classNodes,
    specNodes,
    pvpTalents: jsonTree['pvp_talents'].map(deserializePvpTalent),
    classSize,
    specSize,
  }

  return tree;
}
