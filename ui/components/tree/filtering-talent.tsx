import { TalentFilterMode } from "@/lib/loadout-filter";
import { colorToStyle, getProgressColor, getUsageColor } from "@/lib/style-constants";
import { Talent } from "@/lib/talents";
import { TalentUsage } from "@/lib/usage";
import { createStyles, getStylesRef, Popover, Progress } from "@mantine/core";
import { useState } from "react";
import FilteringTalentTooltip from "./filtering-talent-tooltip";


const useStyles = createStyles(theme => ({
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
    backgroundPosition: 'center',
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
  progress: {
    width: 56,
  }
}));

interface TalentData {
  talent: Talent;
  usage: TalentUsage;
  filterMode: TalentFilterMode;
}

interface FilteringTalentProps {
  talentsData: TalentData[];
  usage: number;
  onTalentSelect: (talent: Talent) => void;
  onTalentDeselect: (talent: Talent) => void;
  tooltipDirection: 'left' | 'right';
}

export default function FilteringTalent({
  talentsData,
  usage,
  onTalentSelect,
  onTalentDeselect,
  tooltipDirection
}: FilteringTalentProps) {
  const { classes } = useStyles();
  let talentColorStyle = colorToStyle(getUsageColor(usage));
  const [showTooltip, setShowTooltip] = useState(false);



  return (
    <Popover
      position={tooltipDirection}
      withArrow
      shadow="xl"
      zIndex={5}
      opened={showTooltip}
    >
      <Popover.Target>
        <div
          className={classes.iconGroup}
          onMouseOver={() => {
            if (talentsData.length == 1)
              setShowTooltip(true);
          }}
          onMouseOut={() => setShowTooltip(false)}
        >
          <div className={classes.usage} style={{color: talentColorStyle}}>
            {Math.round(usage * 100)}%
          </div>
          {talentsData.map((talentData, index) => {
            let talentUsage = usage;
            if (talentsData.length > 1) {
              talentUsage = talentData.usage.percent;
            }
            const talent = talentData.talent;
            let width = 56;
            if (talentsData.length > 1) {
              const otherUsage = talentsData[index == 0 ? 1 : 0].usage;
              let ratio = 0.5;
              if (talentData.usage.selected + otherUsage.selected > 0) {
                ratio = talentData.usage.selected / (otherUsage.selected + talentData.usage.selected);
              }

              width = Math.max(13, Math.min(54 - 13, Math.round(54 * ratio)));
            }
            return (
              <div
                key={talent.id}
                onClick={() => onTalentSelect(talent)}
                onContextMenu={e => {
                  e.preventDefault();
                  onTalentDeselect(talent);
                }}
                style={{
                  backgroundImage: `url(${talent.icon})`,
                  filter: `grayscale(${0.75 - talentUsage * 0.75}) contrast(${talentUsage * 0.5 + 0.5}) brightness(${talentUsage * 0.5 + 0.5})`,
                  backgroundColor: colorToStyle(getProgressColor(talentUsage)),
                  width,
                }}
                className={classes.icon}
              >
              </div>
            );
          })}

          <div className={classes.progress}>
            <Progress
              size='sm'
              value={usage * 100}
              color={talentColorStyle}
            />
          </div>
        </div>
      </Popover.Target>
      {showTooltip && (
        <Popover.Dropdown sx={{ pointerEvents: 'none' }}>
          <FilteringTalentTooltip
            talent={talentsData[0].talent}
            usage={talentsData[0].usage}
            filterMode={talentsData[0].filterMode}
          />
        </Popover.Dropdown>
      )}
    </Popover>
  );
}
