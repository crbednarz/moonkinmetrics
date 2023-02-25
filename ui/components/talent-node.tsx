import { useMemo, useState, CSSProperties } from 'react';
import { TalentNode } from '../lib/talents'
import Image from 'next/image';

type UsageByRank = number[];

type NodeUsage = { [key: number]: UsageByRank };

interface TalentNodeViewProps {
  node: TalentNode;
  usage: NodeUsage;
  filterTalent: number;
  filterText: string;
  onTalentSelect: (talentId: number) => void;
}

export default function TalentNodeView({
  node,
  usage,
  filterText,
  onTalentSelect,
}: TalentNodeViewProps) {
  return (
    <button
      style={{
        position: 'absolute',
        left: node.x * 700,
        top: node.y * 700,
      }}
    >
      {node.talents.map(talent => {
        const usageByRank = usage[talent.id];
        const total = usageByRank.reduce((sum, cur) => sum + cur);

        return (
          <Image
            style={{
              opacity: 1.0 - (usageByRank[0] / total),
            }}
            src={talent.icon} 
            alt={talent.name}
            width={50/node.talents.length}
            height={50}
            key={talent.id}
            onClick={() => onTalentSelect(talent.id)}
          />
        );
      })}
    <span
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
      }}
    >
      {filterText}
    </span>
    </button>
  );
}

