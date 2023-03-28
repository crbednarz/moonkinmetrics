import { useState } from 'react';
import { Talent } from '@/lib/talents'
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter, TalentFilterMode, nextTalentFilterMode, pvpTalentFilter } from '@/lib/loadout-filter';
import { getPvpTalentUsage } from '@/lib/usage';
import { Flex } from '@mantine/core';
import FilteringPvpTalent from './filtering-pvp-talent'

interface TalentFilter {
  mode: TalentFilterMode,
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
    <Flex gap={5} wrap="wrap"> 
      {talents.map(talent => {
        let usage = usageMap[talent.id];

        return (
          <FilteringPvpTalent
            key={talent.id}
            talent={talent}
            filterMode={talentFilters[talent.id]?.mode ?? TalentFilterMode.None}
            onSelect={(talent)=>{talentFilterSelected(talent)}}
            onDeselect={(talent)=>{talentFilterDeselected(talent)}}
            usage={usage}
          />
        );
      })}

    </Flex>
  );
}

function cycleFilter(talentFilters: TalentFilterMap, talent: Talent) {
  let nextTalentFilters = {...talentFilters};

  const previousMode = talentFilters[talent.id]?.mode ?? TalentFilterMode.None;
  const nextMode = nextTalentFilterMode(previousMode, 1);

  const filter = pvpTalentFilter(talent.id, nextMode);

  if (filter == null) {
    delete nextTalentFilters[talent.id];
  } else {
    nextTalentFilters[talent.id] = {
      mode: nextMode,
      filter: filter,
    }
  }

  return nextTalentFilters;
}
