import fs from 'fs';
import path from 'path';

export interface LoadoutNode {
  nodeId: number;
  talentId: number;
  rank: number;
}

export interface RatedLoadout {
  classNodes: LoadoutNode[];
  specNodes: LoadoutNode[];
  rating: number;
}

const wowDirectory = path.join(process.cwd(), 'wow')

export function getLeaderboard(className: string, specName: string, bracket: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'pvp', bracket, fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const leaderboard = JSON.parse(fileContents);

  let loadouts: RatedLoadout[] = [];

  for (let entry of leaderboard['entries']) {
    loadouts.push({
      classNodes: entry['class_nodes'].map(deserializeNode),
      specNodes: entry['spec_nodes'].map(deserializeNode),
      rating: entry['rating'],
    });
  }

  return loadouts;
}

function deserializeNode(jsonNode: any) {
  return {
      nodeId: jsonNode['node_id'],
      talentId: jsonNode['talent_id'],
      rank: jsonNode['rank'],
  };
}
