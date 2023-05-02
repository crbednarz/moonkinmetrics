import { TalentFilterMode } from '@/lib/loadout-filter';
import { colorToStyle, getTalentColors } from '@/lib/style-constants';
import { Talent } from '@/lib/talents'
import { TalentUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';
import FilteringTalent from '../tree/filtering-talent';

const useStyles = createStyles(theme => ({
  node: {
    display: 'inline-block',
    border: `1px solid ${theme.colors.dark[4]}`,
    borderRadius: theme.radius.sm,
    padding: 5,
  }
}));

interface FilteringPvpTalentProps {
  talent: Talent;
  usage: TalentUsage;
  filterMode: TalentFilterMode;
  onSelect: (talent: Talent) => void;
  onDeselect: (talent: Talent) => void;
  highlightTalent?: number;
}

export default function FilteringPvpTalent({
  talent,
  usage,
  filterMode,
  onSelect,
  onDeselect,
  highlightTalent,
}: FilteringPvpTalentProps) {
  const { classes } = useStyles();
  const { borderColor, bgColor } = getTalentColors(usage.percent, filterMode);

  return (
    <div
      className={classes.node}
      style={{
        borderColor: colorToStyle(borderColor),
        backgroundColor: colorToStyle(bgColor),
      }}
    >
      <FilteringTalent
        talentsData={[{
          talent,
          usage,
          filterMode,
        }]}
        usage={usage.percent}
        onTalentSelect={onSelect}
        onTalentDeselect={onDeselect}
        tooltipDirection="top"
        highlightTalent={highlightTalent}
      />
    </div>
  );
}
