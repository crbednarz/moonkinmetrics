import { useMemo, useState } from 'react';
import { TalentNode } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter, TalentFilterMode, nextTalentFilterMode, talentFilter } from '@/lib/loadout-filter';
import FilteringTalentNode from './filtering-talent-node';
import { getNodeUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';
import SubTreeConnectionSvg from './sub-tree-connection-svg';

const useStyle = createStyles(() => ({
  nodeGroup: {
  },
  node: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
    '&:hover': {
      zIndex: 2,
    }
  },
}));

interface NodeFilter {
  mode: TalentFilterMode,
  selectedTalent: number,
  filter: LoadoutFilter,
}

type NodeFilterMap = {[key: number]: NodeFilter}

interface FilteringNodeGroupProps {
  nodes: TalentNode[];
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
};

export default function FilteringNodeGroupView({
  nodes,
  loadouts,
  onFiltersChange,
}: FilteringNodeGroupProps) {
  const { classes } = useStyle();
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

  const blizzardIconSpacing = 600;
  const iconSize = 56;
  const iconPadding = 23;
  const paddedIconSize = iconSize + iconPadding * 2;

  const bounds = useMemo(() => getBounds(nodes), [nodes]);

  let width = (bounds.maxX - bounds.minX) / blizzardIconSpacing * paddedIconSize;
  let height = (bounds.maxY - bounds.minY) / blizzardIconSpacing * paddedIconSize;

  const positions = useMemo(() => {
    return nodes.map(node => {
      let x = node.x;
      let y = node.y;

      x = (x - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX);
      y = (y - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY);

      x = x * width;
      y = y * height;

      return {x, y}
    });
  }, [nodes, bounds, width, height]);

  return (
    <div style={{
      padding: `${paddedIconSize * 0.5}px ${paddedIconSize * 0.75}px`,
    }}>
      <div style={{
        position: 'relative',
        width,
        height,
      }}>
        <SubTreeConnectionSvg
          positionedNodes={nodes.map((node, index) => ({
            x: positions[index].x,
            y: positions[index].y,
            node,
          }))}
          usageMap={usageMap}
        />
        {nodes.map((node, index) => {
          return (
            <FilteringTalentNode
              key={node.id}
              style={{
                left: positions[index].x,
                top: positions[index].y,
              }}
              className={classes.node}
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


function getBounds(nodes: TalentNode[]) {
  let minX = nodes[0].x;
  let minY = nodes[0].y;
  let maxX = minX;
  let maxY = minY;

  for (let node of nodes) {
    minX = Math.min(node.x, minX);
    minY = Math.min(node.y, minY);
    maxX = Math.max(node.x, maxX);
    maxY = Math.max(node.y, maxY);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}
