import styles from './filtering-talent-node.module.scss';
import {colorToStyle, getProgressColor, globalColors, lerpColors} from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsage } from '@/lib/usage';
import { Button, createStyles, Flex, RangeSlider, rem, Space, Title, Image, Text, RingProgress, Box, BackgroundImage, Progress, useMantineTheme, getStylesRef, Popover } from '@mantine/core';
import {useState} from 'react';

const useStyles = createStyles(theme => ({
  node: {
    position: 'absolute',
    [`&:hover .${getStylesRef('iconLabel')}`]: {
    },
  },
  icon: {
    width: 56,
    height: 56,
    color: 'white',
    borderRadius: 13,
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    backgroundColor: theme.colors.dark[6],
    overflow: 'hidden',
    borderRadius: 15,
    background: theme.colors.dark[5],
    padding: 3,
  },
  iconProgress: {
    content: "''",
    width: 62,
    height: 62,
    position: 'absolute',
    top: 0,
    left: 0,
    background: theme.colors.primary[2],
  },
  iconLabel: {
    ref: getStylesRef('iconLabel'),
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 900,
    width: 28,
    height: 28,
    left: -10,
    top: -10,
    zIndex: 1,
    background: theme.colors.dark[6],
    border: `1px solid ${theme.colors.dark[5]}`,
    borderRadius: 14,
  },
  multiple: {
    width: 28,
    height: 56,
    display: 'inline-block',
    border: `1px solid ${theme.colors.dark[7]}`,
    backgroundPosition: 'center',
    '&:nth-child(2)': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&:nth-child(3)': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    }
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

  const clipPolygon = [
    {x: 0, y: 0},
  ];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4) * Math.PI * 2 * usage.percent - Math.PI * 3 / 4;
    clipPolygon.push({
      x: Math.cos(angle) * 100,
      y: Math.sin(angle) * 100,
    });
  }

  const clipPath = `polygon(${clipPolygon.map(p => `${p.x+31}px ${p.y+31}px`).join(', ')})`;

  const lowColor = {
    r: 175,
    g: 55,
    b: 0,
  };

  const highColor = lerpColors(lowColor, globalColors.hightlight[9], usage.percent);

  const borderColor = lerpColors(lowColor, highColor, usage.percent);
  const [popoverOpened, setPopoverOpened] = useState(false);
  return (
    <div
      className={classes.node}
      style={{
        left: node.x - 3,
        top: node.y - 3,
      }}
      onMouseOver={() => setPopoverOpened(true)}
      onMouseLeave={() => setPopoverOpened(false)}
    >
      <div
        className={classes.iconLabel}
        style={{
          borderColor: colorToStyle(getProgressColor(usage.percent)),
          color: colorToStyle(getProgressColor(usage.percent)),
        }}
      >
        {`${Math.round(usage.percent * 100)}`}
      </div>
      <Popover opened={popoverOpened} withArrow position="right" width={200} transitionProps={{ transition: 'pop' }}>
        <Popover.Target>
          <div className={classes.iconContainer}>
            <div className={classes.iconProgress}
              style={{
                clipPath,
                backgroundColor: colorToStyle(borderColor),
              }}
            />
            {node.talents.map((talent, index) => {
              const talentUsage = usage.talents[talent.id];

              return (
                <div
                  className={`${classes.icon} ${node.talents.length > 1 ? classes.multiple : ''}`}
                  key={index}
                  style={{
                    filter: `grayscale(${1.0 - talentUsage.percent}) contrast(${talentUsage.percent * 0.5 + 0.5}) brightness(${talentUsage.percent * 0.5 + 0.5})`,
                    backgroundColor: colorToStyle(getProgressColor(usage.percent)),
                    backgroundImage: `url(${talent.icon})`,
                  }}
                />
              );
            })}
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Text color="dark" size="sm" weight={500}>
            <Title>
            </Title>
            {node.talents[0].name}
          </Text>
          <Box style={{padding: 10}} />
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

