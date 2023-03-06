import { quantile } from '@/lib/util';

interface RatingGraphProps {
  ratings: number[],
  min?: number,
  max?: number,
}

export default function RatingGraph({
  ratings,
  min: minOverride,
  max: maxOverride,
}: RatingGraphProps) {
  const min = minOverride ?? ratings[ratings.length - 1];
  const max = maxOverride ?? ratings[0];
  const q = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const value = quantile(ratings, 1.0 - p);
    return (value - min) / (max - min);
  });
  return (
    <svg
      style={{
        width: '100%',
        height: 20
      }}
      width="100%"
    >
      <line
        x1={`${100 * q[0]}%`}
        y1="0%"
        x2={`${100 * q[0]}%`}
        y2="100%"
        strokeWidth={2}
        stroke="grey"
      />
      <line
        x1={`${100 * q[4]}%`}
        y1="0%"
        x2={`${100 * q[4]}%`}
        y2="100%"
        strokeWidth={2}
        stroke="grey"
      />
      <line
        x1={`${100 * q[0]}%`}
        y1="50%"
        x2={`${100 * q[4]}%`}
        y2="50%"
        strokeWidth={2}
        stroke="grey"
      />
      <rect
        x={`${100 * q[1]}%`}
        y="0%"
        width={`${100 * (q[3]-q[1])}%`}
        height="100%"
        strokeWidth={2}
        stroke="grey"
        fill="rgb(80, 80, 80)"
      />
      <line
        x1={`${100 * q[2]}%`}
        y1="0%"
        x2={`${100 * q[2]}%`}
        y2="100%"
        strokeWidth={2}
        stroke="grey"
      />
      {ratings.map((rating, i) => (
        <circle
          key={i}
          cx={`${100 * (rating - min) / (max - min)}%`}
          cy="50%"
          r="4px"
          fill="rgba(255, 255, 255, 0.05)"
        />
      ))}
    </svg>
  );
}

