import styles from './filtering-talent-node.module.scss';
import { PvpTalent } from '@/lib/talents'

interface FilteringPvpTalentProps {
  talent: PvpTalent;
  usage: number;
  disabled?: boolean;
  highlight?: boolean;
  onSelect: (talent: PvpTalent) => void;
}

export default function FilteringPvpTalent({
  talent,
  usage,
  disabled,
  highlight,
  onSelect,
}: FilteringPvpTalentProps) {
  const usageText = `${Math.round(usage * 100)}%`;
  const usageColor = `rgb(${(1.0 - usage)*255}, ${usage*255}, 0)`;

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
        <div
          className={styles.talent}
          style={{
            filter: `grayscale(${1.0 - usage})`,
            opacity: 0.5 + usage * 0.5,
            backgroundImage: `url(${talent.icon})`,
          }}
          key={talent.id}
          onClick={() => onSelect(talent)}
        />
      </div>
    </div>
  );
}
