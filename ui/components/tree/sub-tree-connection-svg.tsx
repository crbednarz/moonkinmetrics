import { getProgressColor } from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsageMap } from '@/lib/usage';

interface Line {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
}

interface PositionedNode {
  x: number,
  y: number,
  node: TalentNode,
}

interface SubTreeConnectionSvgProps {
  positionedNodes: PositionedNode[],
  usageMap: NodeUsageMap,
}

export default function SubTreeConnectionSvg({
  positionedNodes,
  usageMap,
}: SubTreeConnectionSvgProps) {
  let positionMap = positionedNodes.reduce<{[key: number]: {x: number, y: number}}>((map, positionedNode) => {
    const node = positionedNode.node;
    map[node.id] = {
      x: positionedNode.x,
      y: positionedNode.y,
    };
    return map;
  }, {});

  let lines: Line[] = [];

  for (let {x, y, node} of positionedNodes) {
    for (let lockedById of node.lockedBy) {
      if (!(lockedById in positionMap))
        continue;

      const {
        x: otherX,
        y: otherY,
      } = positionMap[lockedById];
      const usage = usageMap[node.id];
      const parentUsage = usageMap[lockedById];
      const colorDelta = Math.min(parentUsage.percent, usage.percent);
      const color = getProgressColor(colorDelta);
      
      lines.push({
        x1: x,
        y1: y,
        x2: otherX,
        y2: otherY,
        width: 3,
        color: `rgb(${color.r}, ${color.g}, ${color.b})`,
      });
    }
  }

  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    >
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          strokeWidth={line.width}
          opacity={0.5}
          stroke={line.color}
        />
      ))}
    </svg>
  );
}
