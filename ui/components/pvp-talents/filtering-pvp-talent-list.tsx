import { useState } from 'react';
import { Talent } from '@/lib/talents'
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter, TalentFilterMode, nextTalentFilterMode, pvpTalentFilter } from '@/lib/loadout-filter';
import { getPvpTalentUsage } from '@/lib/usage';
import { createStyles, Flex, Text } from '@mantine/core';
import { colorToStyle, globalColors } from "@/lib/style-constants";
import FilteringPvpTalent from './filtering-pvp-talent'

const useStyles = createStyles(theme => ({
  wrapper: {
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  group: {
    position: 'relative',
    maxWidth: '300px',
    padding: '10px',
    flexGrow: 1,
    alignContent: 'center',
    display: 'inline-block',
    borderRadius: '10px',
    background: theme.colors.dark[6],
    boxSizing: 'border-box',
    border: `1px solid ${theme.colors.dark[5]}`,
    gap: '5px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  label: {
    fontSize: '1.4em',
    color: colorToStyle(globalColors.highValue[9]),
  },
}));
interface TalentFilter {
  mode: TalentFilterMode,
  filter: LoadoutFilter,
}

type TalentFilterMap = { [key: number]: TalentFilter }

interface FilteringPvpTalentListProps {
  talents: Talent[]
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
  highlight?: RatedLoadout,
}

export default function FilteringPvpTalentList({
  talents,
  loadouts,
  onFiltersChange,
  highlight,
}: FilteringPvpTalentListProps) {
  const { classes } = useStyles();
  let [talentFilters, setTalentFilters] = useState<TalentFilterMap>({});

  function talentFilterSelected(talent: Talent) {
    const nextTalentFilters = cycleFilter(talentFilters, talent);
    onFiltersChange(Object.values<TalentFilter>(nextTalentFilters).map(f => f.filter));
    setTalentFilters(nextTalentFilters);
  }

  function talentFilterDeselected(talent: Talent) {
    const nextTalentFilters = { ...talentFilters };
    delete nextTalentFilters[talent.id];
    onFiltersChange(Object.values<TalentFilter>(nextTalentFilters).map(f => f.filter));
    setTalentFilters(nextTalentFilters);
  }

  const usageMap = getPvpTalentUsage(talents, loadouts);

  return (
    <div className={classes.wrapper}>
      <Text className={classes.label}>PvP Talents</Text>
      <Flex className={classes.group} gap={5} wrap="wrap" justify="center">
        {talents.map(talent => {
          let usage = usageMap[talent.id];

          let highlightTalent;
          if (highlight && highlight.pvpTalents.includes(talent.id)) {
            highlightTalent = talent.id;
          }

          return (
            <FilteringPvpTalent
              key={talent.id}
              talent={talent}
              filterMode={talentFilters[talent.id]?.mode ?? TalentFilterMode.None}
              onSelect={(talent) => { talentFilterSelected(talent) }}
              onDeselect={(talent) => { talentFilterDeselected(talent) }}
              usage={usage}
              highlightTalent={highlightTalent}
            />
          );
        })}
      </Flex>
    </div>
  );
}

function cycleFilter(talentFilters: TalentFilterMap, talent: Talent) {
  let nextTalentFilters = { ...talentFilters };

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
