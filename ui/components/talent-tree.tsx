import { useMemo, useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { Talent, TalentNode, TalentTree } from '../lib/talents'
import TalentNodeView from './talent-node'

type RankFilterFunc = (rank: number) => boolean;

interface RankFilter {
  name: string;
  func: RankFilterFunc;
}

interface NodeFilter {
  selectedTalent: number;
  filterIndex: number;
}

interface TalentTreeViewProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};


function getTalentUsage(talentId: number, loadouts: RatedLoadout[]) {
  const usageByRank = [0, 0, 0, 0];
  for (let entry of loadouts) {
    const rank = entry.talents[talentId] ?? 0;
    usageByRank[rank]++;
  }

  return usageByRank;
}


export default function TalentTreeView({ tree, leaderboard }: TalentTreeViewProps) {
  let [nodeFilters, setNodeFilters] = useState(() => {
    let filters: { [key: number]: NodeFilter } = {};
    for (let node of [...tree.classNodes, ...tree.specNodes]) {
      filters[node.id] = {
        selectedTalent: node.talents[0].id,
        filterIndex: ALWAYS_RANK_INDEX,
      }
    }
    return filters;
  });

  function updateTalentFilter(node: TalentNode, talentId: number) {
    const index = nodeFilters[node.id].filterIndex;
    const nextIndex = (index + 1) % (node.talents.length + 2);
    setNodeFilters({
      ...nodeFilters,
      [node.id]: {
        selectedTalent: talentId,
        filterIndex: nextIndex,
      }
    });
  }

  const loadouts = leaderboard.filter(loadout => {
    for (let nodeId in nodeFilters) {
      const filter = nodeFilters[nodeId];
      if (filter.selectedTalent == 0)
        continue;

      const rank = loadout.talents[filter.selectedTalent] ?? 0;
      const result = RANK_FILTERS[filter.filterIndex].func(rank);
      if (!result)
        return false;
    }
    return true;
  });

  return (
    <>
    <h1>Entries: {loadouts.length}</h1>
      <div style={{position: 'relative', display: 'inline-block', width:700, height:800}}>
        {tree.classNodes.map(node => {
          let usage: { [key: number]: number[] } = {};
          usage = node.talents.reduce((usage, talent) => {
            usage[talent.id] = getTalentUsage(talent.id, loadouts);
            return usage;
          }, usage);
          let filter = nodeFilters[node.id];
          return (
            <TalentNodeView
              key={node.id}
              node={node}
              usage={usage}
              filterTalent={filter.selectedTalent}
              filterText={RANK_FILTERS[filter.filterIndex].name}
              onTalentSelect={talentId => updateTalentFilter(node, talentId)}
            />
          )
        })}
      </div>
      <div style={{position: 'relative', display: 'inline-block', width:700, height:800}}>
        {tree.specNodes.map(node => {
          let usage: { [key: number]: number[] } = {};
          usage = node.talents.reduce((usage, talent) => {
            usage[talent.id] = getTalentUsage(talent.id, loadouts);
            return usage;
          }, usage);
          let filter = nodeFilters[node.id];
          return (
            <TalentNodeView
              key={node.id}
              node={node}
              usage={usage}
              filterTalent={filter.selectedTalent}
              filterText={RANK_FILTERS[filter.filterIndex].name}
              onTalentSelect={talentId => updateTalentFilter(node, talentId)}
            />
          )
        })}

      </div>
    </>
  );
}


const ALWAYS_RANK_INDEX: number = 1;

const RANK_FILTERS: RankFilter[] = [
  {
    name: 'Never',
    func: rank => rank == 0,
  },
  {
    name: '',
    func: rank => true
  },
  {
    name: 'Any',
    func: rank => rank >= 1
  },
  {
    name: '2+',
    func: rank => rank >= 2
  },
  {
    name: '3+',
    func: rank => rank >= 3
  }
];
