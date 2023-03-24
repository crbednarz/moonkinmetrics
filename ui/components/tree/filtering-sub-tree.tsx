import { useState } from 'react';
import { TalentNode } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter, TalentFilterMode, nextTalentFilterMode, talentFilter } from '@/lib/loadout-filter';
import FilteringTalentNode from './filtering-talent-node';
import SubTreeConnectionSvg from './sub-tree-connection-svg'; 
import { getNodeUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';

const useStyles = createStyles(theme => ({
  tree: {
    position: 'relative',
    display: 'inline-block',
    borderRadius: '10px',
    padding: '10px',
    background: theme.colors.dark[6],
    border: `1px solid ${theme.colors.dark[5]}`,
    textAlign: 'center',
  },
  innerTree: {
    position: 'relative',
    margin: 'auto 0',
    display: 'inline-block',
  },
}));

interface NodeFilter {
  mode: TalentFilterMode,
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
  const { classes } = useStyles();

  return (
    <div className={classes.tree}>
      <SubTreeConnectionSvg
        width={width}
        height={height}
        nodes={nodes}
        usageMap={usageMap}
      />
      <div
        className={classes.innerTree}
        style={{
          width,
          height
        }}
      >
        {nodes.map(node => {
          return (
            <FilteringTalentNode
              key={node.id}
              node={node}
              usage={usageMap[node.id]}
              selectedTalent={nodeFilters[node.id]?.selectedTalent}
              filterMode={nodeFilters[node.id]?.mode ?? TalentFilterMode.None}
              onTalentSelect={talentId => talentFilterSelected(node, talentId)}
              onTalentDeselect={() => talentFilterDeselected(node)}
            />
          )
        })}
      </div>
    </div>
  );
}

function cycleFilter(nodeFilters: NodeFilterMap, node: TalentNode, talentId: number) {
  let nextNodeFilters = {...nodeFilters};

  const previousMode = nodeFilters[node.id]?.mode ?? TalentFilterMode.None;
  const nextMode = nextTalentFilterMode(previousMode, node.maxRank);

  const filter = talentFilter(talentId, nextMode);

  if (filter == null) {
    delete nextNodeFilters[node.id];
  } else {
    nextNodeFilters[node.id] = {
      mode: nextMode,
      selectedTalent: talentId,
      filter: filter,
    }
  }

  return nextNodeFilters;
}
