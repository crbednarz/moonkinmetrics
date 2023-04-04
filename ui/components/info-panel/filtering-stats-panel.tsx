import {Leaderboard, RatedLoadout} from "@/lib/pvp";
import {
  Button,
  Flex,
  RangeSlider,
  RingProgress,
  Stack,
  Text,
} from "@mantine/core";
import { useState } from "react";
import RatingHistogram from "../info-panel/rating-histogram";

export interface FilteringStatsPanelProps {
  leaderboard: Leaderboard;
  rangeFilteredLoadouts: RatedLoadout[];
  talentFilteredLoadouts: RatedLoadout[];
  onRatingFilterChange: (minRating: number, maxRating: number) => void;
  onReset: () => void;
}

export default function FilteringStatsPanel({
  leaderboard,
  rangeFilteredLoadouts,
  talentFilteredLoadouts,
  onRatingFilterChange,
  onReset,
}: FilteringStatsPanelProps) {
  const allLoadouts = leaderboard.entries;
  const minRating = allLoadouts[allLoadouts.length - 1].rating;
  const maxRating = allLoadouts[0].rating;
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([minRating, maxRating]);

  const viewingPercent = Math.round(talentFilteredLoadouts.length / rangeFilteredLoadouts.length * 100);

  const filterStep = 25;
  const minFilterRating = Math.floor(minRating/filterStep)*filterStep;
  const maxFilterRating = Math.ceil(maxRating/filterStep)*filterStep;
  const marks = [0, 0.25, 0.5, 0.75, 1.0].map(p => {
    const rating = p * (maxFilterRating - minFilterRating) + minFilterRating;
    return {
      value: rating,
      label: Math.round(rating),
    };
  });

  return (
    <Stack>
      <Flex align="center" gap={10}>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: viewingPercent, color: 'primary' }]}
          label={
            <Text color="primary" weight={700} align="center" size="m">
              {viewingPercent}%
            </Text>
          }
        />
        <Text size="l">
          {(rangeFilteredLoadouts.length != talentFilteredLoadouts.length) ? (
            <><strong>{talentFilteredLoadouts.length}</strong> of <strong>{rangeFilteredLoadouts.length}</strong> loadouts use selected talents.</>
          ) : (
            <>Viewing <strong>{rangeFilteredLoadouts.length}</strong> loadouts.</>
          )}
        </Text>
      </Flex>
      <RatingHistogram
        allRatings={allLoadouts.map(loadout => loadout.rating)}
        filteredRatings={talentFilteredLoadouts.map(loadout => loadout.rating)}
        minRating={ratingFilterRange[0]}
        maxRating={ratingFilterRange[1]}
      />
      <RangeSlider 
        min={minFilterRating}
        max={maxFilterRating}
        step={filterStep}
        defaultValue={[minFilterRating, maxFilterRating]}
        onChange={value => {
          onRatingFilterChange(value[0], value[1]);
          setRatingFilterRange(value);
        }}
        labelAlwaysOn
        marks={marks}
        my={'1.5rem'}
      />
      {leaderboard.timestamp && (
        <Text italic={true} color="primary.9" opacity={0.5} size="sm">
          US scan time: {new Date(leaderboard.timestamp.us).toISOString()}<br/>
          EU scan time: {new Date(leaderboard.timestamp.eu).toISOString()}
        </Text>
      )}
      <Button onClick={onReset}>Reset</Button>
    </Stack>
  );
}
