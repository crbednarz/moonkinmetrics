import {TalentFilterMode} from "@/lib/loadout-filter";
import { Talent } from "@/lib/talents";
import { TalentUsage } from "@/lib/usage";
import { Title, createStyles, Divider } from '@mantine/core';

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
  filterMode: TalentFilterMode;
}

export default function FilteringTalentTooltip({
  talent,
  usage,
  filterMode,
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
          {getTalentDescription(talent, filterMode)}
        </p>
        <Divider my="sm" />
        <p>
          {getTalentFilterDescription(filterMode, talent.ranks.length)}
        </p>
      </div>
    </div>
  );
}

function getTalentDescription(talent: Talent, filterMode: TalentFilterMode) {
  switch (filterMode) {
    case TalentFilterMode.RankTwoAndUp:
      return talent.ranks[1].description;
    case TalentFilterMode.RankThreeAndUp:
      return talent.ranks[2].description;
    default:
      return talent.ranks[0].description;
  }
}

function getTalentFilterDescription(filterMode: TalentFilterMode, maxRank: number) {
  switch (filterMode) {
    case TalentFilterMode.None:
      return "No filter";
    case TalentFilterMode.RankOneAndUp:
      if (maxRank == 1)
        return "Filter: Talent selected";
      return "Filter: At least rank 1";
    case TalentFilterMode.RankTwoAndUp:
      return "Filter: At least rank 2";
    case TalentFilterMode.RankThreeAndUp:
      return "Filter: At least rank 3";
    case TalentFilterMode.RankZero:
      return "Filter: Talent not selected";
  }
}
