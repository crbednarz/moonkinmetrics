import { useState } from 'react';
import { PvpTalent } from '@/lib/talents'
import { RatedLoadout } from '@/lib/pvp';
import { hasPvpTalent, missingPvpTalent, LoadoutFilter } from '@/lib/loadout-filter';
import FilteringPvpTalent from './filtering-pvp-talent'
import styles from './filtering-pvp-talent-list.module.scss';

enum FilterMode {
  MissingTalent,
  HasTalent,
}

interface TalentFilter {
  mode: FilterMode,
  filter: LoadoutFilter,
}

type TalentFilterMap = {[key: number]: TalentFilter}

interface FilteringPvpTalentListProps {
  talents: PvpTalent[]
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
}

export default function FilteringPvpTalentList({
  talents,
  loadouts,
  onFiltersChange,
}: FilteringPvpTalentListProps) {
  let [talentFilters, setTalentFilters] = useState<TalentFilterMap>({});

  function talentFilterSelected(talent: PvpTalent) {
    const nextNodeFilters = cycleFilter(talentFilters, talent);
    onFiltersChange(Object.values<TalentFilter>(nextNodeFilters).map(f => f.filter));
    setTalentFilters(nextNodeFilters);
  }

  return (
    <div> 
      {talents.map(talent => {
        let usage = getTalentUsage(talent.id, loadouts)


        return (
          <FilteringPvpTalent
            key={talent.id}
            talent={talent}
            disabled={talentFilters[talent.id]?.mode == FilterMode.MissingTalent}
            highlight={talentFilters[talent.id]?.mode == FilterMode.HasTalent}
            onSelect={(talent)=>{talentFilterSelected(talent)}}
            usage={usage}
          />
        );
      })}

    </div>
  );
}

function getTalentUsage(talentId: number, loadouts: RatedLoadout[]) {
  let count = 0;
  for (let entry of loadouts) {
    for (let selectedTalent of entry.pvpTalents) {
      if (selectedTalent == talentId) {
        count++;
        break;
      }
    }
  }
  return count / loadouts.length;
}

function cycleFilter(talentFilters: TalentFilterMap, talent: PvpTalent) {
  const previousFilter = talentFilters[talent.id] ?? null;
  let nextTalentFilters = {...talentFilters};

  if (!previousFilter) {
    nextTalentFilters[talent.id] = {
      mode: FilterMode.HasTalent,
      filter: hasPvpTalent(talent.id),
    };
  } else if (previousFilter.mode == FilterMode.HasTalent) {
    nextTalentFilters[talent.id] = {
      mode: FilterMode.MissingTalent,
      filter: missingPvpTalent(talent.id),
    }
  } else if (previousFilter.mode == FilterMode.MissingTalent) {
    delete nextTalentFilters[talent.id];
  }

  return nextTalentFilters;
}
