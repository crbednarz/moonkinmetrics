import { Leaderboard } from "@/lib/pvp";
import {
  Box,
  Button,
  createStyles,
  Flex,
  RangeSlider,
  rem,
} from "@mantine/core";
import { useState } from "react";

const useStyles = createStyles(theme => ({
  ratingFilter: {
  },
  ratingFilterPanel: {
    flexBasis: '100%',
    overflow: 'visible',
    textAlign: 'center',
  },
  ratingFilterPanelInner: {
  },
  presetButton: {
    flexGrow: 1,
    padding: rem(2),
  },
  resetButton: {
    minWidth: rem(20),
    marginLeft: rem(20),
  },
}));

export interface RatingFilterPanelProps {
  leaderboard: Leaderboard;
  minRating: number;
  maxRating: number;
  onRatingFilterChange: (minRating: number, maxRating: number) => void;
}


export default function RatingFilterPanel({
  leaderboard,
  minRating,
  maxRating,
  onRatingFilterChange,
}: RatingFilterPanelProps) {
  const loadouts = leaderboard.entries;
  const leaderboardMin = loadouts[loadouts.length - 1].rating;
  const leaderboardMax = loadouts[0].rating;

  const filterStep = 25;
  const minFilterRating = Math.floor(leaderboardMin/filterStep)*filterStep;
  const maxFilterRating = Math.ceil(leaderboardMax/filterStep)*filterStep;

  const marks = [0, 0.25, 0.5, 0.75, 1.0].map(p => {
    const rating = p * (maxFilterRating - minFilterRating) + minFilterRating;
    return {
      value: rating,
      label: Math.round(rating),
    };
  });

  const { classes } = useStyles();

  const ratingQuickSelect = [1200, 1600, 2000, 2400, 2800, 3200];

  return (
    <Box className={classes.ratingFilterPanel}>
      <Box className={classes.ratingFilterPanelInner}>
        <RangeSlider 
          min={minFilterRating}
          max={maxFilterRating}
          step={filterStep}
          value={[minRating, maxRating]}
          onChange={value => {
            onRatingFilterChange(value[0], value[1]);
          }}
          label={null}
          marks={marks}
          mt={rem(5)}
          mb={'2rem'}
          mx={rem(15)}
        />
        <Flex gap={5}>
          {ratingQuickSelect.filter(rating => {
            return rating >= leaderboardMin && rating <= leaderboardMax;
          }).slice(-4).map(rating => (
            <Button
              key={rating}
              className={classes.presetButton}
              onClick={() => {
                onRatingFilterChange(rating, maxFilterRating);
              }}
            >
              {`${rating}+`}
            </Button>
          ))}
          <Button
            className={classes.resetButton}
            color="dark.4"
            onClick={() => {
              onRatingFilterChange(minFilterRating, maxFilterRating);
            }}
          >
            Reset
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
