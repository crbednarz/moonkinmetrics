import styles from './filtering-talent-node.module.scss';
import { TalentNode } from '../lib/talents'
import { NodeUsage } from '@/lib/usage';

interface FilteringTalentNodeProps {
  node: TalentNode;
  usage: NodeUsage;
  disabled?: boolean;
  selectedTalent?: number;
  minimumRank: number;
  onTalentSelect: (talentId: number) => void;
  onTalentDeselect: (talentId: number) => void;
}

export default function FilteringTalentNode({
  node,
  usage,
  disabled,
  selectedTalent,
  minimumRank,
  onTalentSelect,
  onTalentDeselect,
}: FilteringTalentNodeProps) {
  let nodeClasses = `${styles.node} ${styles[node.nodeType.toLowerCase()]}`;

  if (disabled) {
    nodeClasses += ` ${styles.disabled}`;
  }

  if (minimumRank >= 1) {
    nodeClasses += ` ${styles.locked}`;
  }

  const usageText = `${Math.round(usage.percent * 100)}%`;
  const usageColor = `rgb(${(1.0 - usage.percent)*255}, ${usage.percent*255}, 0)`;

  return (
    <div
      className={nodeClasses}
      style={{
        left: node.x,
        top: node.y,
      }}
    >
      <div className={styles.talentGroup}>
        {node.talents.map(talent => {
          const talentUsage = usage.talents[talent.id];
          let talentClasses = styles.talent;
          if (node.talents.length > 1) {
            talentClasses += ` ${styles.split}`;
          }

          if (disabled && selectedTalent && selectedTalent == talent.id) {
            talentClasses += ` ${styles.disabled}`;
          }
          return (
            <a
              className={talentClasses}
              data-wowhead={`spell=${talent.spellId}`}
              style={{
                filter: `grayscale(${1.0 - talentUsage.percent})`,
                opacity: 0.5 + talentUsage.percent * 0.5,
                backgroundImage: `url(${talent.icon})`,
              }}
              key={talent.id}
              onClick={() => onTalentSelect(talent.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onTalentDeselect(talent.id);
              }}
            />
          );
        })}
      </div>
      <div
        className={styles.usage}
        style={{
          color: usageColor
        }}
      >
        <span>{usageText}</span>
      </div>
      <div className={styles.rank}>
        <span>
          {minimumRank}/{node.maxRank}
        </span>
      </div>
    </div>
  );
}

