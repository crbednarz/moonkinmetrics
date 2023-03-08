import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button, createStyles, Flex, RangeSlider, rem, Space, Title, Text } from '@mantine/core';
import FilteringSubTree from './filtering-sub-tree';
import FilteringPvpTalentList from '@/components/pvp-talents/filtering-pvp-talent-list';
import InfoPanel from '../info-panel/info-panel';
import RatingsPlot from '../info-panel/ratings-plot';

const useStyles = createStyles(theme => ({
  wrapper: {
    display: 'inline-grid',
    maxWidth: '100%',
    gridTemplateColumns: '[content] min-content [side-bar] min-content',
    gridTemplateRows: '[top-bar] min-content [content] auto [pvp-talents] auto',
    '& > *:first-child': {
      minWidth: rem(400),
      gridRow: 'top-bar / last-line',
      gridColumn: 'side-bar',
    },
    minWidth: theme.breakpoints.md,
    [`@media (max-width: ${theme.breakpoints.sm})`]: {
      display: 'block',
      minWidth: 'auto',
      '& > *': {
        gridColumn: 'content / end',

      },
      '& > *:first-child': {
        gridRow: 'top-bar',
        gridColumn: 'content / end',
      },
    },
    gap: '10px',
  },
  trees: {
    maxWidth: '100%',
    gap: '10px',
    [`@media (max-width: ${theme.breakpoints.xl})`]: {
      flexWrap: 'wrap',
    },
  },
}));

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
  const { classes } = useStyles();

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
    <div className={classes.wrapper}>
      <InfoPanel key={`info-${resetCount}`}>
        <Title order={4}>Counts</Title>
        <Text>Total Entries: {leaderboard.length}</Text>
        <Text>Filtered Entries: {loadouts.length}</Text>

        <Space h="xl"/>
        <RatingsPlot
          allRatings={leaderboard.map(loadout => loadout.rating)}
          filteredRatings={loadouts.map(loadout => loadout.rating)}
        />
        <Space h="xl"/>
        <Title order={4}>Filter By Rating</Title>
        <RangeSlider 
          min={minRating}
          max={maxRating}
          defaultValue={[minRating, maxRating]}
          onChange={value => {
            setRatingFilter(() => (loadout: RatedLoadout) => {
              return loadout.rating >= value[0] && loadout.rating <= value[1];
            });
          }}
          labelAlwaysOn
          marks={marks}
          my={'1.5rem'}
        />
        <Button onClick={reset}>Reset</Button>
      </InfoPanel>
      <Flex className={classes.trees}>
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
      </Flex>
      <FilteringPvpTalentList
        talents={tree.pvpTalents}
        onFiltersChange={filters => setPvpFilters(filters) }
        loadouts={loadouts}
        key={`pvp-${resetCount}`}
      />
    </div>
  );
}
