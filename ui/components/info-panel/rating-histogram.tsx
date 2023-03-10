import {Bar} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import {globalColors} from "@/lib/style-constants";
import {Checkbox} from "@mantine/core";
import {useState} from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RatingHistogramProps {
  allRatings: number[];
  filteredRatings: number[];
  minRating: number,
  maxRating: number,
}

const options: ChartOptions<"bar"> = {
  responsive: true,
  scales: {
    x: {
      type: 'linear',
      stacked: true,
      grid: {
        offset: false
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Ratings',
    },
  },
};


export default function RatingHistogram({
  allRatings,
  filteredRatings,
  minRating,
  maxRating,
}: RatingHistogramProps) {
  let [showAllRatings, setShowAllRatings] = useState(true);

  const labels: number[] = [];
  const ratingStep = getStepSize(minRating, maxRating);
  minRating = Math.floor(minRating / ratingStep) * ratingStep;
  maxRating = Math.ceil(maxRating / ratingStep) * ratingStep;

  for (let rating = minRating; rating <= maxRating; rating += ratingStep) {
    labels.push(rating);
  }
  const [unfilteredBuckets, filteredBuckets] = [allRatings, filteredRatings].map(ratings => (
    ratings.reduce((buckets, rating) => {
      const bucket = Math.floor((rating - minRating) / ratingStep);
      if (bucket < 0 || bucket >= buckets.length) {
        return buckets;
      }
      buckets[bucket] += 1;
      return buckets;
    }, Array(labels.length).fill(0))
  ));

  const colors = globalColors();
  const filteredColor = colors.primary[9];
  const unfilteredColor = colors.dark[5];

  const data = {
    labels,
    datasets: [
      {
        label: 'Visible',
        data: filteredBuckets,
        backgroundColor: `rgb(${filteredColor.r}, ${filteredColor.g}, ${filteredColor.b})`,
      },
    ],
  };

  if (showAllRatings) {
    data.datasets.push({
      label: 'All',
      data: unfilteredBuckets,
      backgroundColor: `rgba(${unfilteredColor.r}, ${unfilteredColor.g}, ${unfilteredColor.b}, 0.5)`,
    });
  }

  return (
    <>
      <Bar height={250} options={options} data={data} />
          <Checkbox
            label="Show All Ratings"
            checked={showAllRatings}
            onChange={() => setShowAllRatings(!showAllRatings)}
          />
    </>
  );
}

function getStepSize(min: number, max: number) {
  const range = max - min;
  if (range <= 500) {
    return 20;
  }
  return 50;
}
