import {Faction, Leaderboard, RatedLoadout} from "@/lib/pvp";
import {
  Box,
  Button,
  createStyles,
  Flex,
  NavLink,
  rem,
  Tabs,
  Text,
} from "@mantine/core";
import { IconChartHistogram, IconExternalLink, IconTrophy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import RatingHistogram from "../info-panel/rating-histogram";
import RatingFilterPanel from "./rating-filter-panel";
import {colorToStyle, getProgressColor} from "@/lib/style-constants";
import moment from "moment";
import Link from "next/link";

const useStyles = createStyles(() => ({
  tabButton: {
    flexGrow: 1,
  },
  tabs: {
  },
  tabPanel: {
    minHeight: rem(300),

  },
  panel: {
    '& > *': {
      minWidth: rem(340),
      flex: '1 1 0px',
    },
  },
}));

export interface FilteringStatsPanelProps {
  leaderboard: Leaderboard;
  loadoutsInRatingRange: number;
  filteredLoadouts: RatedLoadout[];
  onRatingFilterChange: (minRating: number, maxRating: number) => void;
  onReset: () => void;
  showTopPlayers?: boolean;
}


export default function FilteringStatsPanel({
  leaderboard,
  loadoutsInRatingRange,
  filteredLoadouts,
  onRatingFilterChange,
  onReset,
  showTopPlayers = true,
}: FilteringStatsPanelProps) {
  const allLoadouts = leaderboard.entries;
  const minRating = allLoadouts[allLoadouts.length - 1].rating;
  const maxRating = allLoadouts[0].rating;
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([minRating, maxRating]);
  let [activeTab, setActiveTab] = useState<string | null>('histogram');

  const { classes } = useStyles();

  useEffect(() => {
    if (!showTopPlayers)
      return;

    if (Cookies.get('activeTab')) {
      setActiveTab(Cookies.get('activeTab')!);
    }
  }, [showTopPlayers]);

  let percentage = 1;
  if (loadoutsInRatingRange > 0) {
    percentage = filteredLoadouts.length / loadoutsInRatingRange;
  }
  let rangeText = `${ratingFilterRange[0]} - ${ratingFilterRange[1]}`;
  if (ratingFilterRange[0] !== minRating && ratingFilterRange[1] >= maxRating) {
    rangeText = `${ratingFilterRange[0]}+`;
  }

  const stats = (
    <Flex gap={15} direction="column" w="100%">
      <Flex justify="space-between">
        <Stat title="Total Loadouts" value={allLoadouts.length} />
        <Stat title={`${rangeText} Loadouts`} value={loadoutsInRatingRange} />
        <Stat title={`Visible Loadouts`} value={filteredLoadouts.length} />
      </Flex>
    </Flex>
  );

  return (
    <Flex
      className={classes.panel}
      wrap="wrap"
      justify="center"
      align="stretch"
      direction="row"
      gap={20}
    >
      <Tabs
        value={activeTab}
        onTabChange={value => {
          if (value) {
            Cookies.set('activeTab', value.toString());
            setActiveTab(value);
          }
        }}
        className={classes.tabs}
      >
        <Tabs.List>
          <Tabs.Tab value="histogram" className={classes.tabButton} icon={<IconChartHistogram />}>Histogram</Tabs.Tab>
          {showTopPlayers && (
            <Tabs.Tab value="players" className={classes.tabButton} icon={<IconTrophy />}>Top Players</Tabs.Tab>
          )}
        </Tabs.List>
        <Tabs.Panel value="histogram" className={classes.tabPanel}>
          <RatingHistogram
            allRatings={allLoadouts.map(loadout => loadout.rating)}
            filteredRatings={filteredLoadouts.map(loadout => loadout.rating)}
            minRating={ratingFilterRange[0]}
            maxRating={ratingFilterRange[1]}
          />
        </Tabs.Panel>
        {showTopPlayers && (
          <Tabs.Panel value="players" className={classes.tabPanel}>
            {filteredLoadouts.slice(0, 5).map((loadout, i) => (
              <NavLink
                key={i}
                sx={{
                  alignContent: 'center',
                  alignItems: 'stretch',
                  '& > span': {
                    alignSelf: 'unset',
                    'webkit-align-self': 'unset',
                  },
                }}
                c={loadout.player?.faction == Faction.Horde ? "horde.4" : "alliance.4"}
                icon={loadout.rating}
                label={loadout.player?.name}
                description={loadout.player?.realm.name}
                rightSection={
                  <Link href={armoryUrl(loadout)} target="_blank">
                    <IconExternalLink />
                  </Link>
                }

              />
            ))}
          </Tabs.Panel>
        )}
      </Tabs>
      <Flex
        wrap="wrap"
        justify="space-evenly"
        direction="column"
        mih={rem(250)}
        mah={rem(350)}
      >
        <Box w="100%">
          <Text size="lg" align="center">
            Viewing{' '}
            <Text component="span" weight={500} color={colorToStyle(getProgressColor(percentage))}>
              {Math.round(percentage * 100)}%
            </Text>
            {' '}of players at {rangeText}
          </Text>
          <RatingFilterPanel
            leaderboard={leaderboard}
            onRatingFilterChange={(minRating, maxRating) => {
              setRatingFilterRange([minRating, maxRating]);
              onRatingFilterChange(minRating, maxRating);
            }}
          />
        </Box>
        {stats}
        <Box w="100%">
          <Button onClick={onReset} color="dark.4" w="100%" m={0}>Reset All</Button>
          {leaderboard.timestamp && (
            <Text color="dimmed" size="sm" align="center" mt={rem(5)}>
              Updated
              US: {moment(leaderboard.timestamp.us).fromNow()} | 
              EU: {moment(leaderboard.timestamp.eu).fromNow()}
            </Text>
          )}
        </Box>
      </Flex>
    </Flex>

  );
}


function Stat({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {

  return (
    <div>
      <Text c="dimmed" tt="uppercase" fw={700} fz="xs" maw={rem(75)}>
        {title}
      </Text>
      <Text fw={700} fz="xl">
        {value}
      </Text>
    </div>
  );
}


function armoryUrl(loadout: RatedLoadout) {
  if (!loadout.player)
    return '';
  
  let url = `https://worldofwarcraft.com/en-us/character/us/`;
  if (loadout.region == 'eu') {
    url = `https://worldofwarcraft.com/en-gb/character/eu/`;
  }
  url += `${loadout.player?.realm.slug}/${loadout.player?.name}`;
  return url;
}
