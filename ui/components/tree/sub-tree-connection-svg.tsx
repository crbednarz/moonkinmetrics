import {RatedLoadout} from '@/lib/pvp';
import { getProgressColor, globalColors } from '@/lib/style-constants';
import { TalentNode } from '@/lib/talents';
import { NodeUsageMap } from '@/lib/usage';

interface Line {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  opacity: number,
}

interface PositionedNode {
  x: number,
  y: number,
  node: TalentNode,
}

interface SubTreeConnectionSvgProps {
  positionedNodes: PositionedNode[],
  usageMap: NodeUsageMap,
  highlight?: RatedLoadout,
}

export default function SubTreeConnectionSvg({
  positionedNodes,
  usageMap,
  highlight,
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
    let highlightSelf = false;
    for (let talent of node.talents) {
      if (highlight?.talents[talent.id]) {
        highlightSelf = true;
        break;
      }
    }

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
      let color = getProgressColor(colorDelta);
      let opacity = 0.5;

      let highlightParent = false;
      for (let talent of Object.keys(parentUsage.talents)) {
        if (highlight?.talents[+talent]) {
          highlightParent = true;
          break;
        }
      }
      if (highlight && highlightSelf && highlightParent) {
        color = globalColors.highlight[5];
        opacity = 0.6;
      }
      
      lines.push({
        x1: x,
        y1: y,
        x2: otherX,
        y2: otherY,
        width: 3,
        color: `rgb(${color.r}, ${color.g}, ${color.b})`,
        opacity,
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
          opacity={line.opacity}
          stroke={line.color}
        />
      ))}
    </svg>
  );
}
