import { Text } from '@mantine/core';
import { HeroTree } from '@/lib/talents';
import { RatedLoadout } from '@/lib/pvp';
import { LoadoutFilter } from '@/lib/loadout-filter';
import { createStyles } from '@mantine/core';
import { getNodeUsage } from '@/lib/usage';
import { colorToStyle, getProgressColor, globalColors } from '@/lib/style-constants';
import FilteringNodeGroup from './filtering-node-group';

const useStyles = createStyles(theme => ({
  wrapper: {
    position: 'relative',
    textAlign: 'center',
    [`@media (max-width: ${theme.breakpoints.sm})`]: {
      display: 'grid',
    }
  },
  tree: {
    position: 'relative',
    display: 'inline-block',
    borderRadius: '10px',
    background: theme.colors.dark[6],
    boxSizing: 'border-box',
    border: `1px solid ${theme.colors.dark[5]}`,
  },
  innerTree: {
    position: 'relative',
    margin: 'auto 0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeNames: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  treeName: {
    fontSize: '1.4em',
  },
  divider: {
    borderBottom: `1px solid ${theme.colors.dark[5]}`,
    height: '1px',
    minWidth: '5px',
  },
}));

interface HeroTreeViewProps {
  leftTree: HeroTree;
  rightTree: HeroTree;
  loadouts: RatedLoadout[];
  onLeftFiltersChange: (filters: LoadoutFilter[]) => void;
  onRightFiltersChange: (filters: LoadoutFilter[]) => void;
  highlight?: RatedLoadout,
};

export default function HeroTreeView({
  leftTree,
  rightTree,
  loadouts,
  onLeftFiltersChange,
  onRightFiltersChange,
  highlight,
}: HeroTreeViewProps) {
  const { classes } = useStyles();


  const usageMap = getNodeUsage([leftTree.nodes[0], rightTree.nodes[0]], loadouts);
  const leftUsage = usageMap[leftTree.nodes[0].id];
  const rightUsage = usageMap[rightTree.nodes[0].id];


  let leftColor = getProgressColor(leftUsage.percent);
  let rightColor = getProgressColor(rightUsage.percent);
  if (highlight?.talents[leftTree.nodes[0].talents[0].id]) {
    leftColor = globalColors.highlight[5];
  }
  if (highlight?.talents[rightTree.nodes[0].talents[0].id]) {
    rightColor = globalColors.highlight[5];
  }
  const leftColorStyle = colorToStyle(leftColor);
  const rightColorStyle = colorToStyle(rightColor);

  return (
    <div className={classes.wrapper}>
      <div className={classes.treeNames}>
        <Text
          className={classes.treeName}
          style={{
            color: leftColorStyle,
          }}
        >{leftTree.name}</Text>
        <div
          className={classes.divider}
          style={{
            borderColor: leftColorStyle,
            flexGrow: leftUsage.percent,
          }}
        ></div>
        <div
          className={classes.divider}
          style={{
            borderColor: rightColorStyle,
            flexGrow: rightUsage.percent,
          }}
        ></div>
        <Text
          className={classes.treeName}
          style={{
            color: rightColorStyle,
          }}
        >{rightTree.name}</Text>
      </div>
      <div className={classes.tree}>
        <div
          className={classes.innerTree}
          style={{
            height: rightTree.size.height
          }}
        >
          <FilteringNodeGroup
            nodes={leftTree.nodes}
            loadouts={loadouts}
            onFiltersChange={onLeftFiltersChange}
            highlight={highlight}
          />
          <FilteringNodeGroup
            nodes={rightTree.nodes}
            loadouts={loadouts}
            onFiltersChange={onRightFiltersChange}
            highlight={highlight}
          />
        </div>
      </div>
    </div >
  );
}
