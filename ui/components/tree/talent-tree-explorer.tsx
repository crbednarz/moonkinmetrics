import { useState } from 'react';
import { Leaderboard, RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button, createStyles, Flex, rem, Menu } from '@mantine/core';
import { IconChartHistogram } from '@tabler/icons-react';
import FilteringSubTree from './filtering-sub-tree';
import FilteringPvpTalentList from '@/components/pvp-talents/filtering-pvp-talent-list';
import InfoPanel from '../info-panel/info-panel';
import FilteringStatsPanel from '@/components/info-panel/filtering-stats-panel';

const useStyles = createStyles(theme => ({
  wrapper: {
    display: 'inline-grid',
    maxWidth: '100%',
    gridTemplateColumns: '[content] min-content [side-bar] min-content',
    gridTemplateRows: '[top-bar] min-content [content] auto [pvp-talents] auto',
    columnGap: 30,
    rowGap: 10,
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      display: 'flex',
      flexDirection: 'column',
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
      width: '100%',
      overflow: 'auto',
    },
  },
  infoPanel: {
    gridRow: 'top-bar / last-line',
    gridColumn: 'side-bar',
    [`@media (max-width: ${theme.breakpoints.md})`]: {
      display: 'none',
    },
  },
  sideBar: {
    '& > div > div': {
      flexDirection: 'column',
      minHeight: rem(700),
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
    padding: 15,
    minWidth: rem(390),
  },
}));

interface TalentTreeExplorerProps {
  tree: TalentTree;
  leaderboard: Leaderboard;
};

export default function TalentTreeExplorer({
  tree,
  leaderboard,
}: TalentTreeExplorerProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  let [ratingFilter, setRatingFilter] = useState<LoadoutFilter>();
  let [resetCount, setResetCount] = useState<number>(0);
  let [statsOpened, setStatsOpened] = useState(false);
  let [highlightedLoadout, setHighlightedLoadout] = useState<RatedLoadout>();


  const allLoadouts = leaderboard.entries;
  const minRating = allLoadouts[allLoadouts.length - 1].rating;
  const maxRating = allLoadouts[0].rating;
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([minRating, maxRating]);

  const talentFilters = [
    ...classFilters,
    ...specFilters,
    ...pvpFilters,
  ];
  let allTalentsLoadouts = leaderboard.entries;
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
    setHighlightedLoadout(undefined);
    setResetCount(resetCount + 1);
  }


  function updateRatingFilter(min: number, max: number) {
    setRatingFilterRange([min, max]);
    setRatingFilter(() => (loadout: RatedLoadout) => {
      return loadout.rating >= min && loadout.rating <= max;
    });
  }

  const infoPanelContents = (
    <FilteringStatsPanel
      leaderboard={leaderboard}
      filteredLoadouts={loadouts}
      loadoutsInRatingRange={allTalentsLoadouts.length}
      onRatingFilterChange={updateRatingFilter}
      minRating={ratingFilterRange[0]}
      maxRating={ratingFilterRange[1]}
      highlightLoadout={highlightedLoadout}
      onHighlightLoadout={loadout => {
        if (loadout == highlightedLoadout) {
          setHighlightedLoadout(undefined);
        } else {
          setHighlightedLoadout(loadout);
        }
      }}
      onReset={reset}
    />
  );

  return (
    <div className={classes.wrapper}>
      <InfoPanel className={`${classes.infoPanel} ${classes.sideBar}`} key={`info-${resetCount}`}>
        {infoPanelContents}
      </InfoPanel>
      <Menu
        shadow="xl"
        position="bottom"
        width="target"
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
          {infoPanelContents}
        </Menu.Dropdown>
      </Menu>
      <Flex className={classes.trees}>
        <FilteringSubTree
          key={`class-${resetCount}`}
          nodes={tree.classNodes}
          onFiltersChange={filters => setClassFilters(filters) }
          loadouts={loadouts}
          width={tree.classSize.width}
          height={tree.classSize.height}
          highlight={highlightedLoadout}
        />
        <FilteringSubTree
          key={`spec-${resetCount}`}
          nodes={tree.specNodes}
          onFiltersChange={filters => setSpecFilters(filters) }
          loadouts={loadouts}
          width={tree.specSize.width}
          height={tree.specSize.height}
          highlight={highlightedLoadout}
        />
      </Flex>
      <div className={classes.pvpTalents}>
        <FilteringPvpTalentList
          key={`pvp-${resetCount}`}
          talents={tree.pvpTalents}
          onFiltersChange={filters => setPvpFilters(filters) }
          loadouts={loadouts}
        />
      </div>
    </div>
  );
}
