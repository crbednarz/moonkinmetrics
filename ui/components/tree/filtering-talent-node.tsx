import styles from './filtering-talent-node.module.scss';
import {colorToStyle, getProgressColor, globalColors, lerpColors} from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsage } from '@/lib/usage';
import { Button, createStyles, Flex, RangeSlider, rem, Space, Title, Image, Text, RingProgress, Box, BackgroundImage, Progress, useMantineTheme, getStylesRef, Popover } from '@mantine/core';
import {useState} from 'react';
import FilteringTalentTooltip from './filtering-talent-tooltip';

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
  iconGroup: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 56,
    rowGap: 4,
    columnGap: 1,
    [`&:hover .${getStylesRef('usage')}`]: {
      display: 'flex',
    },
  },
  icon: {
    display: 'inline-block',
    border: `1px solid ${theme.colors.dark[7]}`,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    width: 56,
    height: 56,
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center',
    [`&.${getStylesRef('multiple')}`]: {
      width: 27,
    },
  },
  usage: {
    position: 'absolute',
    borderRadius: theme.radius.sm,
    zIndex: 2,
    pointerEvents: 'none',
    ref: getStylesRef('usage'),
    width: 56,
    height: 56,
    background: 'rgba(20, 20, 20, 0.85)',
    fontSize: 21,
    fontWeight: 700,
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiple: {
    ref: getStylesRef('multiple'),
  },
  progress: {
    width: 56,
    
  }
}));

interface FilteringTalentNodeProps {
  node: TalentNode;
  usage: NodeUsage;
  disabled?: boolean;
  selectedTalent?: number;
  minimumRank: number;
  onTalentSelect: (talentId: number) => void;
  onTalentDeselect: (talentId: number) => void;
}

export default function FilteringTalentNode({
  node,
  usage,
  disabled,
  selectedTalent,
  minimumRank,
  onTalentSelect,
  onTalentDeselect,
}: FilteringTalentNodeProps) {
  const { classes } = useStyles();

  const lowColor = {
    r: 175,
    g: 55,
    b: 0,
  };

  const highColor = lerpColors(lowColor, globalColors.hightlight[9], usage.percent);

  let usageColor = lerpColors(lowColor, highColor, usage.percent);
  let borderStrength = 0.3;
  let bgStrength = 0.2;
  if (selectedTalent) {
    usageColor = {
      r: 255,
      g: 180,
      b: 50,
    };
    borderStrength = 0.8;
    bgStrength = 0.3;
  }
  const borderColor = lerpColors(usageColor, globalColors.dark[4], 1.0 - borderStrength);
  const bgColor = lerpColors(usageColor, globalColors.dark[5], 1.0 - bgStrength);

  const [expanded, setExpanded] = useState(false);

  let talentGroups = [{
    talents: node.talents,
    usage: usage.percent,
  }];

  if (node.talents.length > 1) {
    if (expanded) {
      talentGroups = node.talents.map(talent => ({
        talents: [talent],
        usage: usage.talents[talent.id].percent,
      }));
    } else {
      talentGroups = [{
        talents: node.talents,
        usage: usage.percent,
      }];
    }
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
          borderColor: colorToStyle(borderColor),
          backgroundColor: colorToStyle(bgColor),
        }}
      >
        {talentGroups.map(talentGroup => {
          let talentColorStyle = colorToStyle(lerpColors(lowColor, highColor, talentGroup.usage));
          if (talentGroup.talents.find(talent => talent.id === selectedTalent)) {
            talentColorStyle = colorToStyle(usageColor);
          }

          return (
            <Popover
              position="right"
              withArrow
              shadow="md"
              zIndex={5}
              opened={expanded}
              key={`${talentGroup.talents[0].id} ${talentGroup.talents.length}`}
            >
              <Popover.Target>
                <div
                  className={classes.iconGroup}
                >
                  <div className={classes.usage} style={{color: talentColorStyle}}>
                    {Math.round(talentGroup.usage * 100)}%
                  </div>
                  {talentGroup.talents.map(talent => {
                    let talentUsage = talentGroup.usage;
                    if (talentGroup.talents.length > 1) {
                      talentUsage = usage.talents[talent.id].percent;
                    }
                    return (
                      <div
                        key={talent.id}
                        onClick={() => onTalentSelect(talent.id)}
                        onContextMenu={e => {
                          e.preventDefault();
                          onTalentDeselect(talent.id);
                        }}
                        style={{
                          backgroundImage: `url(${talent.icon})`,
                          filter: `grayscale(${0.75 - talentUsage * 0.75}) contrast(${talentUsage * 0.5 + 0.5}) brightness(${talentUsage * 0.5 + 0.5})`,
                          backgroundColor: colorToStyle(getProgressColor(talentUsage)),
                        }}
                        className={`${classes.icon} ${talentGroup.talents.length > 1 ? classes.multiple : ''}`}
                      >
                      </div>
                    );
                  })}

                  <div className={classes.progress}>
                    <Progress
                      size='sm'
                      value={talentGroup.usage * 100}
                      color={talentColorStyle}
                    />
                  </div>
                </div>
              </Popover.Target>
              <Popover.Dropdown sx={{ pointerEvents: 'none' }}>
                <FilteringTalentTooltip
                  node={node}
                />
              </Popover.Dropdown>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
