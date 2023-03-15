import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button, createStyles, Flex, RangeSlider, rem, Space, Title, Text, RingProgress } from '@mantine/core';
import FilteringSubTree from './filtering-sub-tree';
import FilteringPvpTalentList from '@/components/pvp-talents/filtering-pvp-talent-list';
import InfoPanel from '../info-panel/info-panel';
import RatingsPlot from '../info-panel/ratings-plot';
import RatingHistogram from '../info-panel/rating-histogram';

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
  timestamp: number;
};

export default function TalentTreeExplorer({
  tree,
  leaderboard,
  timestamp,
}: TalentTreeExplorerProps) {
  const minRating = leaderboard[leaderboard.length - 1].rating;
  const maxRating = leaderboard[0].rating;

  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  let [ratingFilter, setRatingFilter] = useState<LoadoutFilter>();
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([minRating, maxRating]);
  let [resetCount, setResetCount] = useState<number>(0);

  const talentFilters = [
    ...classFilters,
    ...specFilters,
    ...pvpFilters,
  ];
  let allTalentsLoadouts = leaderboard;
  if (ratingFilter) {
    allTalentsLoadouts = filterRatedLoadouts(allTalentsLoadouts, [ratingFilter]);
  }
  const loadouts = filterRatedLoadouts(allTalentsLoadouts, talentFilters);
  const { classes } = useStyles();

  function reset() {
    setResetCount(resetCount + 1);
    setClassFilters([]);
    setSpecFilters([]);
    setPvpFilters([]);
    setRatingFilter(undefined);
  }



  const viewingPercent = Math.round(loadouts.length / allTalentsLoadouts.length * 100);
  const localTime = new Date(timestamp).toISOString();
  const filterStep = 25;
  const minFilterRating = Math.floor(minRating/filterStep)*filterStep;
  const maxFilterRating = Math.ceil(maxRating/filterStep)*filterStep;
  const marks = [0, 0.25, 0.5, 0.75, 1.0].map(p => {
    const rating = p * (maxFilterRating - minFilterRating) + minFilterRating;
    return {
      value: rating,
      label: Math.round(rating),
    };
  });
  return (
    <div className={classes.wrapper}>
      <InfoPanel key={`info-${resetCount}`}>
        <Flex align="center" gap={10}>
          <RingProgress
            size={80}
            thickness={8}
            sections={[{ value: viewingPercent, color: 'primary' }]}
            label={
              <Text color="primary" weight={700} align="center" size="m">
                {viewingPercent}%
              </Text>
            }
          />
          <Text size="l">
            {(talentFilters.length > 0) ? (
              <><strong>{loadouts.length}</strong> of <strong>{allTalentsLoadouts.length}</strong> loadouts use selected talents.</>
            ) : (
              <>Viewing <strong>{loadouts.length}</strong> loadouts.</>
            )}
          </Text>
        </Flex>
        <RatingHistogram
          allRatings={allTalentsLoadouts.map(loadout => loadout.rating)}
          filteredRatings={loadouts.map(loadout => loadout.rating)}
          minRating={ratingFilterRange[0]}
          maxRating={ratingFilterRange[1]}
        />
        <RangeSlider 
          min={minFilterRating}
          max={maxFilterRating}
          step={filterStep}
          defaultValue={[minFilterRating, maxFilterRating]}
          onChange={value => {
            setRatingFilter(() => (loadout: RatedLoadout) => {
              return loadout.rating >= value[0] && loadout.rating <= value[1];
            });
            setRatingFilterRange(value);
          }}
          labelAlwaysOn
          marks={marks}
          my={'1.5rem'}
        />
        <Text italic={true} color="primary.9" opacity={0.5} size="sm">Last scanned: {localTime}</Text>
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
