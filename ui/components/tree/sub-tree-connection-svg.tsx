import {globalColors, lerpColors} from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsageMap } from '@/lib/usage';

interface Line {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
}

interface SubTreeConnectionSvgProps {
  width: number,
  height: number,
  nodes: TalentNode[],
  usageMap: NodeUsageMap,
}

export default function SubTreeConnectionSvg({
  width,
  height,
  nodes,
  usageMap,
}: SubTreeConnectionSvgProps) {
  let nodeMap = nodes.reduce<{[key: number]: TalentNode}>((map, node) => {
    map[node.id] = node;
    return map;
  }, {});
  let lines: Line[] = [];
  const LINE_OFFSET = 28;

  const activeColor = globalColors()['primary'][9];
  const inactiveColor = globalColors()['dark'][8];


  for (let node of nodes) {
    for (let lockedById of node.lockedBy) {
      if (!(lockedById in nodeMap))
        continue;

      const otherNode = nodeMap[lockedById];
      const usage = usageMap[node.id];
      const parentUsage = usageMap[lockedById];
      const colorDelta = Math.min(parentUsage.percent, usage.percent);
      const color = lerpColors(inactiveColor, activeColor, colorDelta)
      const alpha = colorDelta * 0.5 + 0.1;
      lines.push({
        x1: node.x + LINE_OFFSET,
        y1: node.y + LINE_OFFSET,
        x2: otherNode.x + LINE_OFFSET,
        y2: otherNode.y + LINE_OFFSET,
        color: `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`,
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        width: width,
        height: height,
      }}
    >
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          strokeWidth={3}
          stroke={line.color}
        />
      ))}
    </svg>
  );
}
