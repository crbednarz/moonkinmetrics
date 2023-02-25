import { useMemo, useState, CSSProperties } from 'react';
import Image from 'next/image';
import styles from './talent-node.module.scss';
import { TalentNode } from '../lib/talents'

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
    <div
      className={styles.node}
      style={{
        transform: `translate(${node.x * 700}px, ${node.y * 700}px)`,
      }}
    >
      {node.talents.map(talent => {
        const usageByRank = usage[talent.id];
        const total = usageByRank.reduce((sum, cur) => sum + cur);
        let className = styles.talent;
        if (node.talents.length > 1) {
          className += ` ${styles.split}`;
        }

        return (
          <div
            className={className}
            style={{
              opacity: 1.0 - (usageByRank[0] / total),
              backgroundImage: `url(${talent.icon})`,
            }}
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
    </div>
  );
}

