import fs from 'fs';
import path from 'path';

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
}

export interface TalentTree {
  className: string;
  specName: string;
  classNodes: TalentNode[];
  specNodes: TalentNode[];
  pvpTalents: PvpTalent[];
}

const wowDirectory = path.join(process.cwd(), 'wow')

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

function convertNodePositions(nodes: TalentNode[], width: number, height: number) {
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
  const iconPadding = 6;
  const paddedIconSize = iconSize + iconPadding * 2;
  const blizzardIconSpacing = 600;

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
}

export function getTalentTree(className: string, specName: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'talents', fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const jsonTree = JSON.parse(fileContents);

  const tree: TalentTree = {
    className: jsonTree['class_name'],
    specName: jsonTree['spec_name'],
    classNodes: jsonTree['class_nodes'].map(deserializeNode),
    specNodes: jsonTree['spec_nodes'].map(deserializeNode),
    pvpTalents: jsonTree['pvp_talents'].map(deserializePvpTalent),
  }

  convertNodePositions(tree.classNodes, 620, 700);
  convertNodePositions(tree.specNodes, 620, 700);

  return tree;
}
