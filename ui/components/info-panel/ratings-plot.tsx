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
      <Title order={3}>Filtering</Title>
      <Text>Unfiltered Ratings</Text>
      <RatingGraph ratings={allRatings}/>
      <Text>Filtered Ratings</Text>
      <RatingGraph 
        ratings={filteredRatings}
        max={allRatings[0]}
        min={allRatings[allRatings.length - 1]}
      />
    </>
  );
}
