import { RatedLoadout } from '@/lib/pvp';

export type LoadoutFilter = (loadout: RatedLoadout) => boolean;

export function minRankFilter(talentId: number, rank: number) {
  return (loadout: RatedLoadout) => (loadout.talents[talentId] ?? 0) >= rank;
}

export function rankZeroFilter(talentId: number) {
  return (loadout: RatedLoadout) => !(talentId in loadout.talents);
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
