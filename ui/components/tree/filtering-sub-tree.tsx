import { useState } from 'react';
import { TalentNode } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { minRankFilter, rankZeroFilter, LoadoutFilter } from '@/lib/loadout-filter';
import FilteringTalentNode from './filtering-talent-node';
import SubTreeConnectionSvg from './sub-tree-connection-svg'; 
import styles from './filtering-sub-tree.module.scss';
import {getNodeUsage} from '@/lib/usage';

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
  width: number,
  height: number,
};

export default function FilteringSubTreeView({
  nodes,
  loadouts,
  onFiltersChange,
  width,
  height,
}: FilteringSubTreeViewProps) {

  let [nodeFilters, setNodeFilters] = useState<NodeFilterMap>({});

  function talentFilterSelected(node: TalentNode, talentId: number) {
    const nextNodeFilters = cycleFilter(nodeFilters, node, talentId);
    onFiltersChange(Object.values<NodeFilter>(nextNodeFilters).map(f => f.filter));
    setNodeFilters(nextNodeFilters);
  }

  function talentFilterDeselected(node: TalentNode) {
    const nextNodeFilters = {...nodeFilters};
    delete nextNodeFilters[node.id];
    onFiltersChange(Object.values<NodeFilter>(nextNodeFilters).map(f => f.filter));
    setNodeFilters(nextNodeFilters);
  }

  let usageMap = getNodeUsage(nodes, loadouts);

  return (
    <div className={styles.tree}>
      <SubTreeConnectionSvg
        width={width}
        height={height}
        nodes={nodes}
        usageMap={usageMap}
      />
      <div
        className={styles.innerTree}
        style={{
          width,
          height
        }}
      >
        {nodes.map(node => {
          let minimumRank = getMinRank(nodeFilters[node.id]?.mode);
          return (
            <FilteringTalentNode
              key={node.id}
              node={node}
              usage={usageMap[node.id]}
              disabled={nodeFilters[node.id]?.mode == NodeFilterMode.Zero}
              selectedTalent={nodeFilters[node.id]?.selectedTalent}
              minimumRank={minimumRank}
              onTalentSelect={talentId => talentFilterSelected(node, talentId)}
              onTalentDeselect={() => talentFilterDeselected(node)}
            />
          )
        })}
      </div>
    </div>
  );
}

function getMinRank(mode?: NodeFilterMode) {
  let minimumRank = 0;
  switch (mode) {
    case NodeFilterMode.OneAndUp:
      minimumRank = 1;
      break;
    case NodeFilterMode.TwoAndUp:
      minimumRank = 2;
      break;
  }
  return minimumRank;
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
