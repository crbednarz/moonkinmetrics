import { useState } from 'react';
import { Talent } from '@/lib/talents'
import { RatedLoadout } from '@/lib/pvp';
import { hasPvpTalent, missingPvpTalent, LoadoutFilter } from '@/lib/loadout-filter';
import FilteringPvpTalent from './filtering-pvp-talent'
import {getPvpTalentUsage} from '@/lib/usage';
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
  talents: Talent[]
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
}

export default function FilteringPvpTalentList({
  talents,
  loadouts,
  onFiltersChange,
}: FilteringPvpTalentListProps) {
  let [talentFilters, setTalentFilters] = useState<TalentFilterMap>({});

  function talentFilterSelected(talent: Talent) {
    const nextTalentFilters = cycleFilter(talentFilters, talent);
    onFiltersChange(Object.values<TalentFilter>(nextTalentFilters).map(f => f.filter));
    setTalentFilters(nextTalentFilters);
  }

  function talentFilterDeselected(talent: Talent) {
    const nextTalentFilters = {...talentFilters};
    delete nextTalentFilters[talent.id];
    onFiltersChange(Object.values<TalentFilter>(nextTalentFilters).map(f => f.filter));
    setTalentFilters(nextTalentFilters);
  }

  const usageMap = getPvpTalentUsage(talents, loadouts);

  return (
    <div> 
      {talents.map(talent => {
        let usage = usageMap[talent.id];

        return (
          <FilteringPvpTalent
            key={talent.id}
            talent={talent}
            disabled={talentFilters[talent.id]?.mode == FilterMode.MissingTalent}
            highlight={talentFilters[talent.id]?.mode == FilterMode.HasTalent}
            onSelect={(talent)=>{talentFilterSelected(talent)}}
            onDeselect={(talent)=>{talentFilterDeselected(talent)}}
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

function cycleFilter(talentFilters: TalentFilterMap, talent: Talent) {
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
