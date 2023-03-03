import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import { Button } from '@mantine/core';
import styles from './talent-tree-explorer.module.scss';
import FilteringSubTreeView from './filtering-sub-tree';
import FilteringPvpTalentList from './filtering-pvp-talent-list';
import RatingGraph from './rating-graph';

interface TalentTreeExplorerProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};

export default function TalentTreeExplorer({ tree, leaderboard }: TalentTreeExplorerProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  let [resetCount, setResetCount] = useState<number>(0);

  const loadouts = filterRatedLoadouts(leaderboard, [
    ...classFilters,
    ...specFilters,
    ...pvpFilters,
  ]);

  function reset() {
    setResetCount(resetCount + 1);
    setClassFilters([]);
    setSpecFilters([]);
    setPvpFilters([]);
  }

  return (
    <div className={styles.tree}>
      <h5>Viewing {loadouts.length} of {leaderboard.length} loadouts.</h5><br />
      <RatingGraph
        allRatings={leaderboard.map(entry => entry.rating)}
        filteredRatings={loadouts.map(entry => entry.rating)}
      />
      <FilteringSubTreeView
        nodes={tree.classNodes}
        onFiltersChange={filters => setClassFilters(filters) }
        loadouts={loadouts}
        width={tree.classSize.width}
        height={tree.classSize.height}
        key={`class-${resetCount}`}
      />
      <FilteringSubTreeView
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
      <Button
        onClick={reset}
      >
        Reset
      </Button>
    </div>
  );
}
