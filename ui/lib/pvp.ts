import fs from 'fs';
import path from 'path';
import {PvpTalent, TalentNode, TalentTree} from './talents';

type RankByTalent = { [key: number]: number };

export interface RatedLoadout {
  talents: RankByTalent;
  pvpTalents: number[];
  rating: number;
}

const wowDirectory = path.join(process.cwd(), 'wow')

export function getEncodedLeaderboard(className: string, specName: string, bracket: string) {
  const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.json`.replace(' ', '-');
  const filePath = path.join(wowDirectory, 'pvp', bracket, fileName);

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const leaderboard = JSON.parse(fileContents);

  return leaderboard.entries as string[];
}

function createTalentDecodeMap(nodes: TalentNode[]) {
  return nodes.reduce<number[]>((map, node) => {
    for (let talent of node.talents) {
      map.push(talent.id);
    }
    return map;
  }, []);
}

export function decodeLoadouts(encodedLoadouts: string[], tree: TalentTree): RatedLoadout[] {
  const talentMap = createTalentDecodeMap([...tree.classNodes, ...tree.specNodes]);

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
      pvpTalents[i] = tree.pvpTalents[pvpTalentBytes[i]].id;
    }

    return {
      talents,
      pvpTalents,
      rating: +rating,
    };
  });
}
