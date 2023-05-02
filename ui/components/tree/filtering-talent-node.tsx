import { TalentFilterMode } from '@/lib/loadout-filter';
import { colorToStyle, getTalentColors } from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';
import { useState } from 'react';
import FilteringTalent from './filtering-talent';

const useStyles = createStyles(theme => ({
  talentGroup: {
    position: 'relative',
    zIndex: 1,
    padding: 5,
    backgroundColor: theme.colors.dark[5],
    border: `1px solid ${theme.colors.dark[4]}`,
    borderRadius: theme.radius.sm,
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },
}));

interface FilteringTalentNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  node: TalentNode;
  usage: NodeUsage;
  selectedTalent?: number;
  filterMode: TalentFilterMode;
  onTalentSelect: (talentId: number) => void;
  onTalentDeselect: (talentId: number) => void;
  highlightTalent?: number;
}

export default function FilteringTalentNode({
  node,
  usage,
  selectedTalent,
  filterMode,
  onTalentSelect,
  onTalentDeselect,
  highlightTalent,
  ...restProps
}: FilteringTalentNodeProps) {
  const { classes } = useStyles();
  const {
    borderColor, bgColor,
    borderHoverColor, bgHoverColor,
  } = getTalentColors(usage.percent, filterMode);

  const [expanded, setExpanded] = useState(false);

  let talentGroups = [{
    talents: node.talents,
    usage: usage.percent,
  }];

  if (node.talents.length > 1 && expanded) {
    talentGroups = node.talents.map(talent => ({
      talents: [talent],
      usage: usage.talents[talent.id].percent,
    }));
  }

  return (
    <div
      {...restProps}
      onMouseOver={() => setExpanded(true)}
      onMouseOut={() => setExpanded(false)}
    >
      <div
        className={classes.talentGroup}
        style={{
          backgroundColor: colorToStyle(expanded?bgHoverColor:bgColor),
          borderColor: colorToStyle(expanded?borderHoverColor:borderColor),
        }}
      >
        {talentGroups.map(talentGroup => {
          return (
            <FilteringTalent
              key={`${talentGroup.talents[0].id}`}
              talentsData={talentGroup.talents.map(talent => ({
                talent: talent,
                filterMode: (selectedTalent == talent.id) ? filterMode : TalentFilterMode.None,
                usage: usage.talents[talent.id],
              }))}
              usage={talentGroup.usage}
              onTalentSelect={talent => onTalentSelect(talent.id)}
              onTalentDeselect={talent => onTalentDeselect(talent.id)}
              tooltipDirection="bottom"
              highlightTalent={highlightTalent}
            />
          );
        })}
      </div>
    </div>
  );
}

