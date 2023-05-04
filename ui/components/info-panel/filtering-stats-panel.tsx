import {Faction, Leaderboard, RatedLoadout} from "@/lib/pvp";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  createStyles,
  Flex,
  NavLink,
  rem,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconChartHistogram, IconCheck, IconCopy, IconExternalLink, IconTrophy } from "@tabler/icons-react";
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
  minRating: number;
  maxRating: number;
  onRatingFilterChange: (minRating: number, maxRating: number) => void;
  onReset: () => void;
  highlightLoadout?: RatedLoadout;
  onHighlightLoadout?: (loadout?: RatedLoadout) => void;
  showTopPlayers?: boolean;
}


export default function FilteringStatsPanel({
  leaderboard,
  loadoutsInRatingRange,
  filteredLoadouts,
  minRating,
  maxRating,
  onRatingFilterChange,
  onReset,
  highlightLoadout,
  onHighlightLoadout,
  showTopPlayers = true,
}: FilteringStatsPanelProps) {
  const allLoadouts = leaderboard.entries;
  const leaderboardMin = allLoadouts[allLoadouts.length - 1].rating;
  const leaderboardMax = allLoadouts[0].rating;
  let [activeTab, setActiveTab] = useState<string | null>('histogram');
  let [relativeTimestamp, setRelativeTimestamp] = useState<boolean>(false);

  const { classes } = useStyles();

  useEffect(() => {
    if (!showTopPlayers)
      return;

    if (Cookies.get('activeTab')) {
      setActiveTab(Cookies.get('activeTab')!);
    }
  }, [showTopPlayers]);

  useEffect(() => {
    setRelativeTimestamp(true);
  }, [setRelativeTimestamp]);

  let percentage = 1;
  if (loadoutsInRatingRange > 0) {
    percentage = filteredLoadouts.length / loadoutsInRatingRange;
  }
  let rangeText = `${minRating} - ${maxRating}`;
  if (minRating !== leaderboardMin && maxRating >= leaderboardMax) {
    rangeText = `${minRating}+`;
  }

  const topPlayers = filteredLoadouts.slice(0, 5);
  if (onHighlightLoadout && highlightLoadout && !topPlayers.includes(highlightLoadout)) {
    onHighlightLoadout(undefined);
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
            minRating={minRating}
            maxRating={maxRating}
          />
        </Tabs.Panel>
        {showTopPlayers && (
          <Tabs.Panel value="players" className={classes.tabPanel}>
            {topPlayers.map((loadout, i) => (
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
                onClick={() => {
                  if (onHighlightLoadout)
                    onHighlightLoadout(loadout);
                }}
                active={highlightLoadout === loadout}
                rightSection={
                  <Flex gap={10} align="center">
                    <Badge>{loadout.region}</Badge>
                    {loadout.shareCode && (
                      <CopyButton value={loadout.shareCode}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy Talents'} withArrow position="left">
                            <ActionIcon component="span" color="primary.5" onClick={e => {
                              copy();
                              e.stopPropagation();
                            }}>
                              {copied ? <IconCheck size="1.5rem" /> : <IconCopy size="1.5rem" />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    )}
                    <Link href={armoryUrl(loadout)} target="_blank" onClick={e => e.stopPropagation()}>
                      <Tooltip label={'Visit Armory'} withArrow position="left">
                        <IconExternalLink />
                      </Tooltip>
                    </Link>
                  </Flex>
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
            onRatingFilterChange={onRatingFilterChange}
            minRating={minRating}
            maxRating={maxRating}
          />
        </Box>
        {stats}
        <Box w="100%">
          <Button onClick={onReset} color="caution" w="100%" m={0}>Reset All</Button>
          {leaderboard.timestamp && (
            relativeTimestamp ? (
              <Text color="dimmed" size="sm" align="center" mt={rem(5)}>
                Updated
                US: {moment(leaderboard.timestamp.us).fromNow()} | 
                EU: {moment(leaderboard.timestamp.eu).fromNow()}
              </Text>
            ) : (
              <Text color="dimmed" size="sm" align="center" mt={rem(5)}>
                Updated
                US: {new Date(leaderboard.timestamp.us).toLocaleDateString('en-US', {timeZone: 'GMT'})} | 
                EU: {new Date(leaderboard.timestamp.eu).toLocaleDateString('en-US', {timeZone: 'GMT'})}
              </Text>
            )
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
