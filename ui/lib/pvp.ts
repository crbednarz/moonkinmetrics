import fs from 'fs';
import path from 'path';
import { Talent, TalentNode, TalentTree } from './talents';

type RankByTalent = { [key: number]: number };

export interface RatedLoadout {
  talents: RankByTalent;
  pvpTalents: number[];
  rating: number;
}

export interface LeaderboardTimestamp {
  us: number;
  eu: number;
}

const wowDirectory = path.join(process.cwd(), 'wow')

export function getEncodedLeaderboard(className: string, specName: string, bracket: string) {
  const [usResults, euResults] = ['us', 'eu'].map(region => {
    const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.${region}.json`.replace(' ', '-');
    const filePath = path.join(wowDirectory, 'pvp', bracket, fileName);

    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  });

  const entries = [...usResults.entries, ...euResults.entries];
  return {
    'entries': entries.sort((a, b) => b.rating - a.rating),
    'timestamp': {
      'us': usResults.timestamp,
      'eu': euResults.timestamp,
    },
  };
}

function createTalentDecodeMap(nodes: TalentNode[]) {
  let talentIds = [];
  for (let node of nodes) {
    for (let talent of node.talents) {
      talentIds.push(talent.id);
    }
  }
  return talentIds.sort((a, b) => a - b);
}

function createPvpTalentDecodeMap(talents: Talent[]) {
  let talentIds = [];
  for (let talent of talents) {
    talentIds.push(talent.id);
  }
  return talentIds.sort((a, b) => a - b);
}

export function decodeLoadouts(encodedLoadouts: string[], tree: TalentTree): RatedLoadout[] {
  const talentMap = createTalentDecodeMap([...tree.classNodes, ...tree.specNodes]);
  const pvpTalentMap = createPvpTalentDecodeMap(tree.pvpTalents);

  return encodedLoadouts.map(encodedLoadout => {
    const [encodedTalents, encodedPvpTalents, rating] = encodedLoadout.split('|');
    const talentBytes = new Uint8Array(Buffer.from(encodedTalents, 'base64'));
    const pvpTalentBytes = new Uint8Array(Buffer.from(encodedPvpTalents, 'base64'));

    const talents: RankByTalent = {};
    for (let i = 0; i < talentBytes.length; i += 2) {
      const index = talentBytes[i];
      const rank = talentBytes[i + 1];
      talents[talentMap[index]] = rank;
    }

    const pvpTalents: number[] = [];
    for (let i = 0; i < pvpTalentBytes.length; i++) {
      pvpTalents[i] = pvpTalentMap[pvpTalentBytes[i]];
    }

    return {
      talents,
      pvpTalents,
      rating: +rating,
    };
  });
}
