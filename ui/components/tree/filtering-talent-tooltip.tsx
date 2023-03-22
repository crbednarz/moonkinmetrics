import {colorToStyle, getProgressColor, getUsageColor, globalColors, globalThemeColors} from "@/lib/style-constants";
import { TalentNode } from "@/lib/talents";
import { NodeUsage } from "@/lib/usage";
import { Title, Text, Group, RingProgress, createStyles } from '@mantine/core';

const useStyles = createStyles(theme => ({
  tooltip: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

export interface FilteringTalentTooltipProps {
  node: TalentNode;
  usage: NodeUsage;
  talentId: number;
}

export default function FilteringTalentTooltip({
  node,
  usage,
  talentId,
}: FilteringTalentTooltipProps) {
  const { classes } = useStyles();
  const talentUsage = usage.talents[talentId];
  const talent = node.talents.find(t => t.id === talentId);
  if (!talent) {
    return null;
  }

  return (
    <div className={classes.tooltip}>
      <RingProgress
        size={100}
        thickness={16}
        sections={
          talentUsage.usageByRank.slice(1).map((count, i) => ({
            value: Math.round((count / usage.total) * 100),
            color: colorToStyle(getUsageColor(1 - (i / node.maxRank) * 0.5)),
          }))
        }
      />
      <Title order={5}>{talent.name}</Title>
    </div>
  );
}

