import { Bar } from "react-chartjs-2";
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
import { colorToStyle, globalColors } from "@/lib/style-constants";

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

export default function RatingHistogram({
  allRatings,
  filteredRatings,
  minRating,
  maxRating,
}: RatingHistogramProps) {
  const labels: number[] = [];
  const ratingStep = 25;
  const bucketMin = Math.floor(allRatings[allRatings.length-1] / ratingStep) * ratingStep;
  const bucketMax = Math.ceil(allRatings[0] / ratingStep) * ratingStep;

  for (let rating = bucketMin; rating <= bucketMax; rating += ratingStep) {
    labels.push(rating);
  }
  const [unfilteredBuckets, filteredBuckets] = [allRatings, filteredRatings].map(ratings => (
    ratings.reduce((buckets, rating) => {
      const bucket = Math.floor((rating - bucketMin) / ratingStep);
      if (rating < minRating || rating > maxRating) {
        return buckets;
      }
      buckets[bucket] += 1;
      return buckets;
    }, Array(labels.length).fill(0))
  ));

  const filteredColor = globalColors.primary[9];
  const unfilteredColor = globalColors.dark[5];

  const chartColor = colorToStyle(globalColors.primary[5]);
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        stacked: true,
        min: minRating,
        max: maxRating,
        grid: {
          offset: false
        },
        ticks: {
          minRotation: 90,
          maxRotation: 90,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Players Per Rating',
        color: chartColor,
        font: {
          size: 16,
        },
      },
    },
  };



  const data = {
    labels,
    datasets: [
      {
        label: 'Visible',
        data: filteredBuckets,
        backgroundColor: colorToStyle(filteredColor),
      },
      {
        label: 'All',
        data: unfilteredBuckets,
        backgroundColor: colorToStyle(unfilteredColor, 0.5),
      },
    ],
  };

  return (
    <Bar height={250} options={options} data={data} />
  );
}
