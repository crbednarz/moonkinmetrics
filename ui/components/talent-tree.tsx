import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentTree } from '@/lib/talents';
import { filterRatedLoadouts, LoadoutFilter } from '@/lib/loadout-filter';
import SubTalentTreeView from './sub-talent-tree';

interface TalentTreeViewProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};

export default function TalentTreeView({ tree, leaderboard }: TalentTreeViewProps) {
  let [classFilters, setClassFilters] = useState<LoadoutFilter[]>([]);
  let [specFilters, setSpecFilters] = useState<LoadoutFilter[]>([]);
  const loadouts = filterRatedLoadouts(leaderboard, [...classFilters, ...specFilters]);

  return (
    <>
      <h5>Viewing {loadouts.length} of {leaderboard.length} loadouts.</h5><br />
      <SubTalentTreeView
        nodes={tree.classNodes}
        onFiltersChange={filters => setClassFilters(filters) }
        loadouts={loadouts}
      />
      <SubTalentTreeView
        nodes={tree.specNodes}
        onFiltersChange={filters => setSpecFilters(filters) }
        loadouts={loadouts}
      />
    </>
  );
}
