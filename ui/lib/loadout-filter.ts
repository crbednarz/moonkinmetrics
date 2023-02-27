import { RatedLoadout } from '@/lib/pvp';

export type LoadoutFilter = (loadout: RatedLoadout) => boolean;

export function minRankFilter(talentId: number, rank: number) {
  return (loadout: RatedLoadout) => (loadout.talents[talentId] ?? 0) >= rank;
}

export function rankZeroFilter(talentId: number) {
  return (loadout: RatedLoadout) => !(talentId in loadout.talents);
}

export function hasPvpTalent(talentId: number) {
  return (loadout: RatedLoadout) => {
    for (let selectedTalent of loadout.pvpTalents) {
      if (talentId == selectedTalent)
        return true;
    }
    return false;
  };
}

export function missingPvpTalent(talentId: number) {
  return (loadout: RatedLoadout) => {
    for (let selectedTalent of loadout.pvpTalents) {
      if (talentId == selectedTalent)
        return false;
    }
    return true;
  };
}

export function filterRatedLoadouts(loadouts: RatedLoadout[], filters: LoadoutFilter[]) {
  return loadouts.filter(loadout => {
    for (let filter of filters) {
      if (!filter(loadout))
        return false;
    }
    return true;
  });
}
