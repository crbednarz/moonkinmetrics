import fs from 'fs';
import path from 'path';
import { Talent, TalentNode, TalentTree } from './talents';

type RankByTalent = { [key: number]: number };

export enum Faction {
  Unknown,
  Horde,
  Alliance,
}

export interface RatedLoadout {
  talents: RankByTalent;
  pvpTalents: number[];
  rating: number;
  region: string;
  shareCode?: string;
  player?: {
    name: string;
    faction: Faction;
    realm: {
      name: string;
      slug: string;
    };
  };
}

export interface LeaderboardTimestamp {
  us: number;
  eu: number;
}

export interface EncodedLeaderboard {
  'us': any,
  'eu': any,
}

export interface Leaderboard {
  entries: RatedLoadout[];
  timestamp?: LeaderboardTimestamp;
}

const wowDirectory = path.join(process.cwd(), 'wow')

export function getEncodedLeaderboard(className: string, specName: string, bracket: string): EncodedLeaderboard {
  const [usResults, euResults] = ['us', 'eu'].map(region => {
    const fileName = `${className.toLowerCase()}-${specName.toLowerCase()}.${region}.json`.replace(' ', '-');
    const filePath = path.join(wowDirectory, 'pvp', bracket, fileName);

    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  });

  return {
    us: usResults,
    eu: euResults,
  };
}

function createTalentDecodeMap(nodes: TalentNode[]) {
  let talentIds = [];
  let talentsSeen = new Set<number>();
  for (let node of nodes) {
    for (let talent of node.talents) {
      if (!talentsSeen.has(talent.id)) {
        talentsSeen.add(talent.id);
        talentIds.push(talent);
      }
    }
  }
  return talentIds.sort((a, b) => a.id - b.id);
}

function createPvpTalentDecodeMap(talents: Talent[]) {
  let talentIds = [];
  for (let talent of talents) {
    talentIds.push(talent.id);
  }
  return talentIds.sort((a, b) => a - b);
}

function decodeLoadoutsV0(encodedLoadouts: string[], tree: TalentTree, region: string): RatedLoadout[] {
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
      talents[talentMap[index]?.id] = rank;
    }

    const pvpTalents: number[] = [];
    for (let i = 0; i < pvpTalentBytes.length; i++) {
      pvpTalents[i] = pvpTalentMap[pvpTalentBytes[i]];
    }

    return {
      talents,
      pvpTalents,
      rating: +rating,
      faction: Faction.Unknown,
      region,
    };
  });
}

interface V1Leaderboard {
  encoding: {
    version: number;
    realms: {
      name: string,
      slug: string
    }[];
  }
  entries: string[];
  timestamp: number;
}

function decodeLoadoutsV1(encodedLeaderboard: any, tree: TalentTree, region: string): RatedLoadout[] {
  const talentMap = createTalentDecodeMap([...tree.classNodes, ...tree.specNodes]);
  const pvpTalentMap = createPvpTalentDecodeMap(tree.pvpTalents);
  const v1Leaderboard = encodedLeaderboard as V1Leaderboard;

  return v1Leaderboard.entries.map(encodedLoadout => {
    const [b64Data, name, shareCode] = encodedLoadout.split('|');
    const dataBytes = new Uint8Array(Buffer.from(b64Data, 'base64'));

    let index = 0
    const numTalents = dataBytes[index++];
    const talents: RankByTalent = {};
    for (let i = 0; i < numTalents; i++) {
      const talent = talentMap[dataBytes[index++]];
      let rank = 1;
      if (talent.ranks.length > 1) {
        rank = dataBytes[index++];
      }
      talents[talent.id] = rank;
    }

    const numPvpTalents = dataBytes[index++];
    const pvpTalents: number[] = [];
    for (let i = 0; i < numPvpTalents; i++) {
      pvpTalents.push(pvpTalentMap[dataBytes[index++]]);
    }

    const rating = dataBytes[index] | (dataBytes[index + 1] << 8);
    index += 2;

    const realmIndex = dataBytes[index] | (dataBytes[index + 1] << 8);
    index += 2;
    const isHorde = dataBytes[index++] === 1;

    return {
      talents,
      pvpTalents,
      rating,
      region,
      shareCode,
      player: {
        name,
        faction: isHorde ? Faction.Horde : Faction.Alliance,
        realm: {
          name: v1Leaderboard.encoding.realms[realmIndex].name,
          slug: v1Leaderboard.encoding.realms[realmIndex].slug,
        },
      },
    };
  });
}

export function decodeLeaderboard(encodedLeaderboard: EncodedLeaderboard, tree: TalentTree): Leaderboard {
  const usEntries = decodeRegionLeaderboard(encodedLeaderboard.us, tree, 'us');
  const euEntries = decodeRegionLeaderboard(encodedLeaderboard.eu, tree, 'eu');

  return {
    entries: [...usEntries, ...euEntries].sort((a, b) => b.rating - a.rating),
    timestamp: {
      us: encodedLeaderboard.us.timestamp,
      eu: encodedLeaderboard.eu.timestamp,
    },
  }
}

function getEncodingVersion(regionLeaderboard: any): number {
  return regionLeaderboard.encoding?.version ?? 0;
}

function decodeRegionLeaderboard(regionLeaderboard: any, tree: TalentTree, region: string): RatedLoadout[] {
  const version = getEncodingVersion(regionLeaderboard);

  switch (version) {
    case 0:
      return decodeLoadoutsV0(regionLeaderboard.entries, tree, region);
    case 1:
      return decodeLoadoutsV1(regionLeaderboard, tree, region);
    default:
      throw new Error(`Unknown encoding version: ${version}`);
  }
}
