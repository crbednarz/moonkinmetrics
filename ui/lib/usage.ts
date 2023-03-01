import { RatedLoadout } from '@/lib/pvp';
import { PvpTalent, TalentNode } from './talents';

interface TalentUsage {
  selected: number;
  total: number;
  percent: number;
  usageByRank: number[];
}

export interface NodeUsage {
  selected: number;
  total: number;
  percent: number;
  talents: TalentUsageMap;
}

export interface PvpTalentUsage {
  selected: number;
  total: number;
  percent: number;
}

type TalentUsageMap = {
  [key: number]: TalentUsage
}

export type NodeUsageMap = {
  [key: number]: NodeUsage
}

export type PvpTalentUsageMap = {
  [key: number]: PvpTalentUsage
}

export function getNodeUsage(nodes: TalentNode[], loadouts: RatedLoadout[]) {
  return nodes.reduce<NodeUsageMap>((map, node) => {
    let totalSelected = 0;
    const talents = node.talents.reduce<TalentUsageMap>((talentMap, talent) => {
      const usageByRank = loadouts.reduce((usageByRank, loadout) => {
        usageByRank[loadout.talents[talent.id] ?? 0]++;
        return usageByRank;
      }, new Array<number>(node.maxRank + 1).fill(0));
      
      let selected = 0;
      for (let i = 1; i < usageByRank.length; i++)
        selected += usageByRank[i];

      totalSelected += selected;

      talentMap[talent.id] = {
        selected,
        total: loadouts.length,
        usageByRank,
        percent: computePercent(selected, loadouts.length),
      };
      return talentMap;
    }, {});

    map[node.id] = {
      selected: totalSelected,
      total: loadouts.length,
      percent: computePercent(totalSelected, loadouts.length),
      talents,
    };

    return map;
  }, {});
}

export function getPvpTalentUsage(talents: PvpTalent[], loadouts: RatedLoadout[]) {
  return talents.reduce<PvpTalentUsageMap>((map, talent) => {
    const selected = loadouts.reduce((sum, loadout) => {
      sum += loadout.pvpTalents.includes(talent.id) ? 1 : 0;
      return sum;
    }, 0);
    map[talent.id] = {
      selected,
      total: loadouts.length,
      percent: computePercent(selected, loadouts.length),
    }
    return map;
  }, {});
}

function computePercent(selected: number, total: number) {
  if (total == 0)
    return 0;
  return selected / total;
}
