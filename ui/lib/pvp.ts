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

function createPvpIndexMap(talents: PvpTalent[]) {
  return talents.reduce<{[key: number]: number}>((map, talent, index) => {
    map[talent.id] = index;
    return map;
  }, {});
}

function createTalentEncodeMap(nodes: TalentNode[]) {
  let index = 0;
  return nodes.reduce<{[key: number]: number}>((map, node) => {
    for (let talent of node.talents) {
      map[talent.id] = index;
      index++;
    }
    return map;
  }, {});
}

function createTalentDecodeMap(nodes: TalentNode[]) {
  return nodes.reduce<number[]>((map, node) => {
    for (let talent of node.talents) {
      map.push(talent.id);
    }
    return map;
  }, []);
}


export function encodeLoadouts(loadouts: RatedLoadout[], tree: TalentTree) {
  const talentMap = createTalentEncodeMap([...tree.classNodes, ...tree.specNodes]);
  const pvpTalentMap = createPvpIndexMap(tree.pvpTalents);

  return loadouts.map(loadout => {
    const talentBytes = new Uint8Array(Object.keys(loadout.talents).length * 2);
    let i = 0;
    for (let talentId of Object.keys(loadout.talents)) {
      const index = talentMap[+talentId];
      const rank = loadout.talents[+talentId];
      
      talentBytes[i++] = index;
      talentBytes[i++] = rank;
    }

    const pvpTalentsBytes = new Uint8Array(loadout.pvpTalents.map(talentId => {
      return pvpTalentMap[talentId];
    }));

    const encodedTalents = Buffer.from(talentBytes).toString('base64');
    const encodedPvpTalents = Buffer.from(pvpTalentsBytes).toString('base64');

    return `${encodedTalents}|${encodedPvpTalents}|${loadout.rating}`;
  });
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
