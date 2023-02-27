import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import FilteringSubTreeView from './filtering-sub-tree';
import FilteringPvpTalentList from './filtering-pvp-talent-list';

interface TalentTreeExplorerProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};

export default function TalentTreeExplorer({ tree, leaderboard }: TalentTreeExplorerProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  let [pvpFilters, setPvpFilters] = useState<LoadoutFilter[]>([]);
  const loadouts = filterRatedLoadouts(leaderboard, [
    ...classFilters,
    ...specFilters,
    ...pvpFilters,
  ]);

  return (
    <>
      <h5>Viewing {loadouts.length} of {leaderboard.length} loadouts.</h5><br />
      <FilteringSubTreeView
        nodes={tree.classNodes}
        onFiltersChange={filters => setClassFilters(filters) }
        loadouts={loadouts}
      />
      <FilteringSubTreeView
        nodes={tree.specNodes}
        onFiltersChange={filters => setSpecFilters(filters) }
        loadouts={loadouts}
      />
      <FilteringPvpTalentList
        talents={tree.pvpTalents}
        onFiltersChange={filters => setPvpFilters(filters) }
        loadouts={loadouts}
      />
    </>
  );
}
