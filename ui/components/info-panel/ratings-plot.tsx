import { Title, Text } from "@mantine/core";
import dynamic from 'next/dynamic'

interface RatingsInfoProps {
  allRatings: number[];
  filteredRatings: number[];
}

const RatingGraph = dynamic(() => import('./rating-graph'), {
  ssr: false,
});

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
