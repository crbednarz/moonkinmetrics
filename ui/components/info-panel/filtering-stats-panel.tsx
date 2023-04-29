import {Leaderboard, RatedLoadout} from "@/lib/pvp";
import {
  Button,
  createStyles,
  Flex,
  NavLink,
  Progress,
  rem,
  Tabs,
  Text,
} from "@mantine/core";
import { IconChartHistogram, IconTrophy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import RatingHistogram from "../info-panel/rating-histogram";
import RatingFilterPanel from "./rating-filter-panel";
import {colorToStyle, getProgressColor} from "@/lib/style-constants";

const useStyles = createStyles(theme => ({
  tabButton: {
    flexGrow: 1,
  },
  tabs: {
    flexBasis: '100%',
  },
  panel: {
    '& > *': {
      minWidth: rem(340),
    },
  },
}));

export interface FilteringStatsPanelProps {
  leaderboard: Leaderboard;
  loadoutsInRatingRange: number;
  filteredLoadouts: RatedLoadout[];
  onRatingFilterChange: (minRating: number, maxRating: number) => void;
  onReset: () => void;
}


export default function FilteringStatsPanel({
  leaderboard,
  loadoutsInRatingRange,
  filteredLoadouts,
  onRatingFilterChange,
  onReset,
}: FilteringStatsPanelProps) {
  const allLoadouts = leaderboard.entries;
  const minRating = allLoadouts[allLoadouts.length - 1].rating;
  const maxRating = allLoadouts[0].rating;
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([minRating, maxRating]);
  let [activeTab, setActiveTab] = useState<string | null>('histogram');

  const { classes } = useStyles();

  useEffect(() => {
    if (Cookies.get('activeTab')) {
      setActiveTab(Cookies.get('activeTab')!);
    }
  }, []);

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
      <div>
        <Text size="xl" align="center">
          Viewing{' '}
          <Text component="span" weight={500} color={colorToStyle(getProgressColor(percentage))}>
            {Math.round(percentage * 100)}%
          </Text>
          {' '}of players at {rangeText}
        </Text>
      </div>
      <Progress value={percentage * 100}/>
      <Flex justify="space-between">
        <StatFact title="Total Loadouts" value={allLoadouts.length} />
        <StatFact title={`${rangeText} Loadouts`} value={loadoutsInRatingRange} />
        <StatFact title={`Visible Loadouts`} value={filteredLoadouts.length} />
      </Flex>
    </Flex>
  );

  return (
    <Flex
      className={classes.panel}
      wrap="wrap"
      justify="center"
      align="center"
      gap={25}
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
          <Tabs.Tab value="players" className={classes.tabButton} icon={<IconTrophy />}>Top Players</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="histogram" w="100%">
          <RatingHistogram
            allRatings={allLoadouts.map(loadout => loadout.rating)}
            filteredRatings={filteredLoadouts.map(loadout => loadout.rating)}
            minRating={ratingFilterRange[0]}
            maxRating={ratingFilterRange[1]}
          />
        </Tabs.Panel>
        <Tabs.Panel value="players" w="100%">
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
              icon={loadout.rating}
              label={loadout.player?.name}
              description={loadout.player?.realm.name}
            />
          ))}
        </Tabs.Panel>
      </Tabs>
      <RatingFilterPanel
        leaderboard={leaderboard}
        onRatingFilterChange={(minRating, maxRating) => {
          setRatingFilterRange([minRating, maxRating]);
          onRatingFilterChange(minRating, maxRating);
        }}
      />
      {stats}
      <Button onClick={onReset}>Reset All</Button>
      {leaderboard.timestamp && (
        <Text color="primary.9" opacity={0.5} size="sm" w="100%" align="center">
          Last scanned:<br/>
          US: {new Date(leaderboard.timestamp.us).toISOString()}<br/>
          EU: {new Date(leaderboard.timestamp.eu).toISOString()}
        </Text>
      )}
    </Flex>

  );
}


export function StatFact({
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
