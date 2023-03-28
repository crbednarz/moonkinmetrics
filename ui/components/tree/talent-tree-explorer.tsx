import { useState } from 'react';
import { LeaderboardTimestamp, RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button, createStyles, Flex, rem, getStylesRef, Menu } from '@mantine/core';
import FilteringSubTree from './filtering-sub-tree';
import FilteringPvpTalentList from '@/components/pvp-talents/filtering-pvp-talent-list';
import InfoPanel from '../info-panel/info-panel';
import FilteringStatsPanel from '@/components/info-panel/filtering-stats-panel';
import { IconChartHistogram } from '@tabler/icons-react';

const useStyles = createStyles(theme => ({
  wrapper: {
    display: 'inline-grid',
    maxWidth: '100%',
    gridTemplateColumns: '[content] min-content [side-bar] min-content',
    gridTemplateRows: '[top-bar] min-content [content] auto [pvp-talents] auto',
    gap: 10,
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      width: '100%',
      columnGap: 0,
      '& > *': {
        gridColumn: 'content',
      },
    },
  },
  trees: {
    maxWidth: '100%',
    gap: 10,
    [`@media (max-width: ${theme.breakpoints.xl})`]: {
      flexWrap: 'wrap',
    },
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      maxWidth: '100vw',
      overflow: 'auto',
    },
  },
  infoPanel: {
    ref: getStylesRef('infoPanel'),
    gridRow: 'top-bar / last-line',
    gridColumn: 'side-bar',
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      display: 'none',
    },
  },
  pvpTalents: {
    gridRow: 'pvp-talents',
    gridColumn: 'content',
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      gridColumn: 'content',
    },
  },
  expandButton: {
    position: 'sticky',
    top: rem(7),
    zIndex: 8,
    display: 'none',
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      display: 'block',
    },
  },
  infoMenu: {
    padding: 20,
    width: rem(400),
    maxWidth: '100vw',
  },
}));

interface TalentTreeExplorerProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
  timestamp: LeaderboardTimestamp;
};

export default function TalentTreeExplorer({
  tree,
  leaderboard,
  timestamp,
}: TalentTreeExplorerProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  let [ratingFilter, setRatingFilter] = useState<LoadoutFilter>();
  let [resetCount, setResetCount] = useState<number>(0);
  let [statsOpened, setStatsOpened] = useState(false);

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
    setClassFilters([]);
    setSpecFilters([]);
    setPvpFilters([]);
    setRatingFilter(undefined);
    setResetCount(resetCount + 1);
  }


  function updateRatingFilter(min: number, max: number) {
    setRatingFilter(() => (loadout: RatedLoadout) => {
      return loadout.rating >= min && loadout.rating <= max;
    });
  }
  /*
      */
  const infoPanelContents = (
    <FilteringStatsPanel
      allLoadouts={leaderboard}
      rangeFilteredLoadouts={allTalentsLoadouts}
      talentFilteredLoadouts={loadouts}
      timestamp={timestamp}
      onRatingFilterChange={updateRatingFilter}
      onReset={reset}
    />
  );

  return (
    <div className={classes.wrapper}>
      <InfoPanel className={classes.infoPanel} key={`info-${resetCount}`}>
        {infoPanelContents}
      </InfoPanel>
      <Menu
        shadow="xl"
        position="bottom"
        width="400px"
        opened={statsOpened}
        onChange={setStatsOpened}
      >
        <Menu.Target>
          <Button
            className={classes.expandButton}
            variant="filled"
            mx={5}
            size="md"
            p="8px 12px"
            leftIcon={( 
              <IconChartHistogram size="2rem" />
            )}
          >
            {statsOpened?"Hide Stats":"Show Stats"}
          </Button>
        </Menu.Target>
        <Menu.Dropdown className={classes.infoMenu}>
          {statsOpened && infoPanelContents}
        </Menu.Dropdown>
      </Menu>
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
      <div className={classes.pvpTalents}>
        <FilteringPvpTalentList
          talents={tree.pvpTalents}
          onFiltersChange={filters => setPvpFilters(filters) }
          loadouts={loadouts}
          key={`pvp-${resetCount}`}
        />
      </div>
    </div>
  );
}
