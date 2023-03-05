import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button, Flex, RangeSlider, Stack, Tabs, Title } from '@mantine/core';
import FilteringSubTree from './filtering-sub-tree';
import FilteringPvpTalentList from '@/components/pvp-talents/filtering-pvp-talent-list';
import InfoPanel from '../info-panel/info-panel';
import RatingsPlot from '../info-panel/ratings-plot';

interface TalentTreeExplorerProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};

export default function TalentTreeExplorer({
  tree,
  leaderboard
}: TalentTreeExplorerProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  let [ratingFilter, setRatingFilter] = useState<LoadoutFilter>();
  let [resetCount, setResetCount] = useState<number>(0);

  const filters = [
    ...classFilters,
    ...specFilters,
    ...pvpFilters,
  ];
  if (ratingFilter) {
    filters.push(ratingFilter);
  }
  const loadouts = filterRatedLoadouts(leaderboard, filters);

  function reset() {
    setResetCount(resetCount + 1);
    setClassFilters([]);
    setSpecFilters([]);
    setPvpFilters([]);
    setRatingFilter(undefined);
  }

  const minRating = leaderboard[leaderboard.length - 1].rating;
  const maxRating = leaderboard[0].rating;

  const marks = [0, 0.25, 0.5, 0.75, 1.0].map(p => {
    const rating = p * (maxRating - minRating) + minRating;
    return {
      value: rating,
      label: Math.round(rating),
    };
  });

  return (
    <Flex
      justify="center"
      sx={theme => ({
        [`@media (max-width: ${theme.breakpoints.sm})`]: {
          display: 'block'
        },
      })}
    >
      <Stack>
        <FilteringSubTree
          nodes={tree.classNodes}
          onFiltersChange={filters => setClassFilters(filters) }
          loadouts={loadouts}
          width={tree.classSize.width}
          height={tree.classSize.height}
          key={`class-${resetCount}`}
        />
        <FilteringSubTree
          nodes={tree.specNodes}
          onFiltersChange={filters => setSpecFilters(filters) }
          loadouts={loadouts}
          width={tree.specSize.width}
          height={tree.specSize.height}
          key={`spec-${resetCount}`}
        />
        <FilteringPvpTalentList
          talents={tree.pvpTalents}
          onFiltersChange={filters => setPvpFilters(filters) }
          loadouts={loadouts}
          key={`pvp-${resetCount}`}
        />
      </Stack>
      <InfoPanel key={`info-${resetCount}`}>
        <RatingsPlot
          allRatings={leaderboard.map(loadout => loadout.rating)}
          filteredRatings={loadouts.map(loadout => loadout.rating)}
        />
        <Title order={3}>Ratings Range:</Title>
        <RangeSlider 
          min={minRating}
          max={maxRating}
          defaultValue={[minRating, maxRating]}
          onChangeEnd={value => {
            setRatingFilter(() => (loadout: RatedLoadout) => {
              return loadout.rating >= value[0] && loadout.rating <= value[1];
            });
          }}
          labelAlwaysOn
          marks={marks}
          mb={'1rem'}
        />
        <Button onClick={reset}>Reset</Button>
      </InfoPanel>
    </Flex>
  );
}
