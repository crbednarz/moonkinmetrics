import { TalentFilterMode } from '@/lib/loadout-filter';
import { colorToStyle, getTalentColors, getUsageColor, globalColors, lerpColors } from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsage } from '@/lib/usage';
import { createStyles } from '@mantine/core';
import { useState } from 'react';
import FilteringTalent from './filtering-talent';

const useStyles = createStyles(theme => ({
  node: {
    position: 'absolute',
    transform: 'translate(-50%, 0)',
    zIndex: 1,
    '&:hover': {
      zIndex: 2,
    }
  },
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

interface FilteringTalentNodeProps {
  node: TalentNode;
  usage: NodeUsage;
  selectedTalent?: number;
  filterMode: TalentFilterMode;
  onTalentSelect: (talentId: number) => void;
  onTalentDeselect: (talentId: number) => void;
}

export default function FilteringTalentNode({
  node,
  usage,
  selectedTalent,
  filterMode,
  onTalentSelect,
  onTalentDeselect,
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
      className={classes.node}
      style={{
        left: node.x + 28,
        top: node.y - 5,
      }}
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
        {talentGroups.map((talentGroup, talentGroupIndex) => {
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
              tooltipDirection={(talentGroupIndex == 0 && talentGroups.length > 1)?"left":"right"}
            />
          );
        })}
      </div>
    </div>
  );
}

