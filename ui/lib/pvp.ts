import fs from 'fs';
import path from 'path';

type RankByTalent = { [key: number]: number };

export interface RatedLoadout {
  talents: RankByTalent;
  pvpTalents: number[];
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
      talents: [...entry['class_nodes'], ...entry['spec_nodes']].reduce(
        (obj: RankByTalent, cur: any) => {
          obj[cur['talent_id']] = cur['rank'];
          return obj;
        },
      {}),
      pvpTalents: entry['pvp_talents'].map((talent: any) => talent['id']),
      rating: entry['rating'],
    });
  }

  return loadouts;
}
