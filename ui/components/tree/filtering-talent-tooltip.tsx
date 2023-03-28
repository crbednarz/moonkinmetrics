import { TalentFilterMode } from "@/lib/loadout-filter";
import { colorToStyle, getUsageColor, globalColors } from "@/lib/style-constants";
import { Talent } from "@/lib/talents";
import { TalentUsage } from "@/lib/usage";
import { Title, createStyles, Divider, Table, Kbd, Flex, Text, Center } from '@mantine/core';

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

  return (
    <div className={classes.tooltip}>
      <Title order={5}>{talent.name}</Title>
      <Divider my="sm" />
      <div>
        <Table verticalSpacing={3} fontSize={12} striped>
          <tbody>
            {usage.usageByRank.slice(1).map((count, i) => (
              <tr
                key={i}
                style={{
                  color: colorToStyle(getUsageColor((count / usage.total))),
                  fontWeight: 700,
                }}
              >
                <td>{i+1}/{maxRank}</td>
                <td>{Math.round((count / usage.total) * 100)}%</td>
                <td>{count} players</td>
              </tr>
            ))}
            {(talent.ranks.length > 1) && (
              <tr style={{
                backgroundColor: colorToStyle(globalColors.dark[5]),
                color: colorToStyle(getUsageColor(usage.percent)),
                fontWeight: 700,
              }}>

                <td>Total</td>
                <td>{Math.round(usage.percent * 100)}%</td>
                <td>{usage.selected} players</td>
              </tr>
            )}
          </tbody>
        </Table>
        <Divider my="sm" />
        <p>
          {getTalentDescription(talent, filterMode)}
        </p>
        <Divider my="sm" />
        <Center style={{fontSize: 16}} mb={10}>
          Filter: {getTalentFilterDescription(filterMode, talent.ranks.length)}
        </Center>
        <Flex justify="space-between">
          <Text><Kbd mr={5}>LMB</Kbd>Cycle filter</Text>
          <Text>Clear filter<Kbd ml={5}>RMB</Kbd></Text>
        </Flex>
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
      return "None";
    case TalentFilterMode.RankOneAndUp:
      if (maxRank == 1)
    return "Talent selected";
      return "At least rank 1";
    case TalentFilterMode.RankTwoAndUp:
      return "At least rank 2";
    case TalentFilterMode.RankThreeAndUp:
      return "At least rank 3";
    case TalentFilterMode.RankZero:
      return "Talent not selected";
  }
}
