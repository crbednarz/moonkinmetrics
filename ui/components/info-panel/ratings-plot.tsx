import { Title, Text } from "@mantine/core";
import RatingGraph from "./rating-graph";

interface RatingsInfoProps {
  allRatings: number[];
  filteredRatings: number[];
}

export default function RatingsInfo({
  allRatings,
  filteredRatings,
}: RatingsInfoProps) {
  return (
    <>
      <Title order={4}>Unfiltered vs Filtered Ratings</Title>
      <RatingGraph ratings={allRatings}/>
      <RatingGraph 
        ratings={filteredRatings}
        max={allRatings[0]}
        min={allRatings[allRatings.length - 1]}
      />
    </>
  );
}
