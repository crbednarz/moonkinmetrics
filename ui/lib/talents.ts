import fs from 'fs';
import path from 'path';

export interface Talent {
  id: number;
  name: string;
  spellId: number;
  spellName: number;
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

function normalizeNodePositions(nodes: TalentNode[]) {
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

  const range = Math.max(maxX - minX, maxY - minY);
  for (let node of nodes) {
    node.x = (node.x - minX) / range;
    node.y = (node.y - minY) / range;
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
  }

  normalizeNodePositions(tree.classNodes);
  normalizeNodePositions(tree.specNodes);

  return tree;
}
