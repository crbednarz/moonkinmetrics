import { useState } from 'react';
import { TalentNode } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { minRankFilter, rankZeroFilter, LoadoutFilter } from '@/lib/loadout-filter';
import FilteringTalentNode from './filtering-talent-node';
import styles from './filtering-sub-tree.module.scss';

enum NodeFilterMode {
  Zero,
  OneAndUp,
  TwoAndUp,
}

interface NodeFilter {
  mode: NodeFilterMode,
  selectedTalent: number,
  filter: LoadoutFilter,
}

type NodeFilterMap = {[key: number]: NodeFilter}

interface FilteringSubTreeViewProps {
  nodes: TalentNode[];
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
};

export default function FilteringSubTreeView({
  nodes,
  loadouts,
  onFiltersChange,
}: FilteringSubTreeViewProps) {

  let [nodeFilters, setNodeFilters] = useState<NodeFilterMap>({});

  function talentFilterSelected(node: TalentNode, talentId: number) {
    const nextNodeFilters = cycleFilter(nodeFilters, node, talentId);
    onFiltersChange(Object.values<NodeFilter>(nextNodeFilters).map(f => f.filter));
    setNodeFilters(nextNodeFilters);
  }

  return (
    <div className={styles.tree}>
      <div className={styles.innerTree}>
        {nodes.map(node => {
          let usage: { [key: number]: number[] } = {};
          usage = node.talents.reduce((usage, talent) => {
            usage[talent.id] = getTalentUsage(talent.id, loadouts);
            return usage;
          }, usage);
          let minimumRank = 0;
          switch (nodeFilters[node.id]?.mode) {
            case NodeFilterMode.OneAndUp:
              minimumRank = 1;
              break;
            case NodeFilterMode.TwoAndUp:
              minimumRank = 2;
              break;
          }
          return (
            <FilteringTalentNode
              key={node.id}
              node={node}
              usage={usage}
              disabled={nodeFilters[node.id]?.mode == NodeFilterMode.Zero}
              selectedTalent={nodeFilters[node.id]?.selectedTalent}
              minimumRank={minimumRank}
              onTalentSelect={talentId => talentFilterSelected(node, talentId)}
            />
          )
        })}
      </div>
    </div>
  );
}

function getTalentUsage(talentId: number, loadouts: RatedLoadout[]) {
  const usageByRank = [0, 0, 0, 0];
  for (let entry of loadouts) {
    const rank = entry.talents[talentId] ?? 0;
    usageByRank[rank]++;
  }

  return usageByRank;
}

function cycleFilter(nodeFilters: NodeFilterMap, node: TalentNode, talentId: number) {
  const previousFilter = nodeFilters[node.id] ?? null;
  let nextNodeFilters = {...nodeFilters};

  if (!previousFilter) {
    nextNodeFilters[node.id] = {
      mode: NodeFilterMode.OneAndUp,
      selectedTalent: talentId,
      filter: minRankFilter(talentId, 1),
    };
  } else if (previousFilter.mode == NodeFilterMode.Zero) {
    delete nextNodeFilters[node.id];
  } else if (previousFilter.mode == NodeFilterMode.TwoAndUp || node.maxRank == 1) {
    nextNodeFilters[node.id] = {
      mode: NodeFilterMode.Zero,
      selectedTalent: talentId,
      filter: rankZeroFilter(talentId),
    }
  } else {
    nextNodeFilters[node.id] = {
      mode: NodeFilterMode.TwoAndUp,
      selectedTalent: talentId,
      filter: minRankFilter(talentId, 2),
    }
  }

  return nextNodeFilters;
}
