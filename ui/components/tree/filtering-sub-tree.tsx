import { useState } from 'react';
import { TalentNode } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter, TalentFilterMode, nextTalentFilterMode, talentFilter } from '@/lib/loadout-filter';
import FilteringTalentNode from './filtering-talent-node';
import SubTreeConnectionSvg from './sub-tree-connection-svg'; 
import { getNodeUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';
import FilteringNodeGroup from './filtering-node-group';

const useStyles = createStyles(theme => ({
  tree: {
    position: 'relative',
    display: 'inline-block',
    borderRadius: '10px',
    background: theme.colors.dark[6],
    boxSizing: 'border-box',
    border: `1px solid ${theme.colors.dark[5]}`,
    textAlign: 'center',
  },
  innerTree: {
    position: 'relative',
    margin: 'auto 0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

interface FilteringSubTreeViewProps {
  nodes: TalentNode[];
  loadouts: RatedLoadout[];
  onFiltersChange: (filters: LoadoutFilter[]) => void;
  width: number,
  height: number,
  highlight?: RatedLoadout,
};

export default function FilteringSubTreeView({
  nodes,
  loadouts,
  onFiltersChange,
  width,
  height,
  highlight,
}: FilteringSubTreeViewProps) {
  const { classes } = useStyles();

  return (
    <div className={classes.tree}>
      <div
        className={classes.innerTree}
        style={{
          width,
          height
        }}
      >
        <FilteringNodeGroup
          nodes={nodes}
          loadouts={loadouts}
          onFiltersChange={onFiltersChange}
          highlight={highlight}
        />
      </div>
    </div>
  );
}
