import { RatedLoadout } from '@/lib/pvp';

export type LoadoutFilter = (loadout: RatedLoadout) => boolean;

function minRankFilter(talentId: number, rank: number) {
  return (loadout: RatedLoadout) => (loadout.talents[talentId] ?? 0) >= rank;
}

function rankZeroFilter(talentId: number) {
  return (loadout: RatedLoadout) => (loadout.talents[talentId] ?? 0) == 0;
}

function hasPvpTalent(talentId: number) {
  return (loadout: RatedLoadout) => {
    for (let selectedTalent of loadout.pvpTalents) {
      if (talentId == selectedTalent)
        return true;
    }
    return false;
  };
}

function missingPvpTalent(talentId: number) {
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

export enum TalentFilterMode {
  None,
  RankZero,
  RankOneAndUp,
  RankTwoAndUp,
  RankThreeAndUp,
}

export function nextTalentFilterMode(mode: TalentFilterMode, maxRank: number) {
  switch (mode) {
    case TalentFilterMode.None:
      return TalentFilterMode.RankOneAndUp;
    case TalentFilterMode.RankOneAndUp:
      if (maxRank > 1) {
        return TalentFilterMode.RankTwoAndUp;
      } else {
        return TalentFilterMode.RankZero;
      }
    case TalentFilterMode.RankTwoAndUp:
      if (maxRank > 2) {
        return TalentFilterMode.RankThreeAndUp;
      } else {
        return TalentFilterMode.RankZero;
      }
    case TalentFilterMode.RankThreeAndUp:
      return TalentFilterMode.RankZero;
    case TalentFilterMode.RankZero:
      return TalentFilterMode.None;
  }
}

export function talentFilter(talentId: number, mode: TalentFilterMode) {
  switch (mode) {
    case TalentFilterMode.None:
      return null;
    case TalentFilterMode.RankZero:
      return rankZeroFilter(talentId);
    case TalentFilterMode.RankOneAndUp:
      return minRankFilter(talentId, 1);
    case TalentFilterMode.RankTwoAndUp:
      return minRankFilter(talentId, 2);
    case TalentFilterMode.RankThreeAndUp:
      return minRankFilter(talentId, 3);
  }
}

export function pvpTalentFilter(talentId: number, mode: TalentFilterMode) {
  switch (mode) {
    case TalentFilterMode.None:
      return null;
    case TalentFilterMode.RankZero:
      return missingPvpTalent(talentId);
    case TalentFilterMode.RankOneAndUp:
    case TalentFilterMode.RankTwoAndUp:
    case TalentFilterMode.RankThreeAndUp:
      return hasPvpTalent(talentId);
  }
}
