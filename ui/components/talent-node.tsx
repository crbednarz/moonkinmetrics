import { useMemo, useState, CSSProperties } from 'react';
import Image from 'next/image';
import styles from './talent-node.module.scss';
import { TalentNode } from '../lib/talents'

type UsageByRank = number[];

type NodeUsage = { [key: number]: UsageByRank };

interface TalentNodeViewProps {
  node: TalentNode;
  usage: NodeUsage;
  disabled?: boolean;
  selectedTalent?: number;
  minimumRank?: number;
  onTalentSelect: (talentId: number) => void;
}

export default function TalentNodeView({
  node,
  usage,
  disabled,
  selectedTalent,
  minimumRank,
  onTalentSelect,
}: TalentNodeViewProps) {
  let nodeClasses = styles.node;

  if (disabled) {
    nodeClasses += ` ${styles.disabled}`;
  }

  if (minimumRank) {
    nodeClasses += ` ${styles.locked}`;
  }

  let usageByRank: UsageByRank = [0, 0, 0, 0];
  if (selectedTalent) {
    usageByRank = usage[selectedTalent];
  } else {
    for (let talent of node.talents) {
      for (let i in usageByRank) {
        usageByRank[i] += usage[talent.id][i];
      }
    }
  }

  const total = usageByRank.reduce((sum, cur) => sum + cur);
  const usageValue = 1.0 - usageByRank[0] / total;
  const usageText = `${Math.round(usageValue * 100)}%`;
  const usageColor = `rgb(${(1.0 - usageValue)*255}, ${usageValue*255}, 0)`;

  return (
    <div
      className={nodeClasses}
      style={{
        left: node.x,
        top: node.y,
      }}
    >
      <div
        className={styles.usage}
        style={{
          color: usageColor
        }}
      >
        <span>{usageText}</span>
      </div>
      <div className={styles.talentGroup}>
        {node.talents.map(talent => {
          const usageByRank = usage[talent.id];
          const total = usageByRank.reduce((sum, cur) => sum + cur);
          let talentClasses = styles.talent;
          if (node.talents.length > 1) {
            talentClasses += ` ${styles.split}`;
          }

          if (disabled && selectedTalent && selectedTalent == talent.id) {
            talentClasses += ` ${styles.disabled}`;
          }
          return (
            <div
              className={talentClasses}
              style={{
                filter: `grayscale(${usageByRank[0] / total})`,
                opacity: 0.5 + (1.0 - (usageByRank[0] / total)) * 0.5,
                backgroundImage: `url(${talent.icon})`,
              }}
              key={talent.id}
              onClick={() => onTalentSelect(talent.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

