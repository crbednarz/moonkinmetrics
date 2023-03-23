import { colorToStyle, getUsageColor } from "@/lib/style-constants";
import { Talent, TalentNode } from "@/lib/talents";
import { NodeUsage, TalentUsage } from "@/lib/usage";
import { Title, RingProgress, createStyles, List, ThemeIcon, Stack, Divider } from '@mantine/core';

const useStyles = createStyles(() => ({
  tooltip: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    maxWidth: 300,
    fontSize: 12,
  },
}));

export interface FilteringTalentTooltipProps {
  talent: Talent;
  usage: TalentUsage;
}

export default function FilteringTalentTooltip({
  talent,
  usage,
}: FilteringTalentTooltipProps) {
  const { classes } = useStyles();
  const maxRank = talent.ranks.length;
  /* Info to display:
   * - Talent name
   * - Talent total usage (%, #)
   *   - Loadouts at rank n: x% (y of z) 
   * - Talent usage by rank (%, #)
   * - Filter type
   * - Total ranks
   * - Tooltip for current rank?
   */

  return (
    <div className={classes.tooltip}>
      <Title order={5}>{talent.name}</Title>
      <Divider my="sm" />
      <div>
        {usage.usageByRank.slice(1).map((count, i) => (
          <span key={i}>{i+1}/{maxRank}: {Math.round((count / usage.total) * 100)}% ({count} players)<br/></span>
        ))}
        <Divider my="sm" />
        <p>
          {talent.ranks[0].description}
        </p>
      </div>
    </div>
  );
}

