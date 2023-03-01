import styles from './filtering-talent-node.module.scss';
import { PvpTalent } from '@/lib/talents'
import { PvpTalentUsage } from '@/lib/usage';

interface FilteringPvpTalentProps {
  talent: PvpTalent;
  usage: PvpTalentUsage;
  disabled?: boolean;
  highlight?: boolean;
  onSelect: (talent: PvpTalent) => void;
  onDeselect: (talent: PvpTalent) => void;
}

export default function FilteringPvpTalent({
  talent,
  usage,
  disabled,
  highlight,
  onSelect,
  onDeselect,
}: FilteringPvpTalentProps) {
  const usageText = `${Math.round(usage.percent * 100)}%`;
  const usageColor = `rgb(${(1.0 - usage.percent)*255}, ${usage.percent*255}, 0)`;

  let classes = `${styles.node} ${styles['pvp-talent']}`;
  if (disabled)
    classes += ` ${styles.disabled}`;

  if (highlight)
    classes += ` ${styles.locked}`;

  return (
    <div className={classes}>
      <div
        className={styles.usage}
        style={{
          color: usageColor
        }}
      >
        <span>{usageText}</span>
      </div>
      <div className={styles.talentGroup}>
        <a
          data-wowhead={`spell=${talent.spellId}`}
          className={styles.talent}
          style={{
            filter: `grayscale(${1.0 - usage.percent})`,
            opacity: 0.5 + usage.percent * 0.5,
            backgroundImage: `url(${talent.icon})`,
          }}
          key={talent.id}
          onClick={() => onSelect(talent)}
          onContextMenu={(e) => {
            e.preventDefault();
            onDeselect(talent);
          }}
        />
      </div>
    </div>
  );
}
