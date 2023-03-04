import { Button, Title, Text } from "@mantine/core";
import InfoPanel from "./info-panel";
import RatingGraph from "./rating-graph";

interface TalentsInfoPanelProps {
  children: React.ReactNode,
  allRatings: number[];
  filteredRatings: number[];
}

export default function TalentsInfoPanel({
  children,
  allRatings,
  filteredRatings,
}: TalentsInfoPanelProps) {

  return (
    <InfoPanel>
      <Title order={3}>Filtering</Title>
      <br/>
      <Text>Unfiltered Ratings</Text>
      <RatingGraph 
        ratings={allRatings}
      />
      <br/><br/>
      <Text>Filtered Ratings</Text>
      <RatingGraph 
        ratings={filteredRatings}
        max={allRatings[0]}
        min={allRatings[allRatings.length - 1]}
      />
      <br/>
      <br/>
      {children}
    </InfoPanel>
  );
}
