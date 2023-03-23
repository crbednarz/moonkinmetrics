import { Talent } from '@/lib/talents'
import { TalentUsage } from '@/lib/usage';
import FilteringTalent from '../tree/filtering-talent';

interface FilteringPvpTalentProps {
  talent: Talent;
  usage: TalentUsage;
  disabled?: boolean;
  highlight?: boolean;
  onSelect: (talent: Talent) => void;
  onDeselect: (talent: Talent) => void;
}

export default function FilteringPvpTalent({
  talent,
  usage,
  disabled,
  highlight,
  onSelect,
  onDeselect,
}: FilteringPvpTalentProps) {
  return (
    <div style={{ display: 'inline-block', margin: 5 }}>
      <FilteringTalent
        talents={[talent]}
        talentsUsage={[usage]}
        usage={usage.percent}
        onTalentSelect={onSelect}
        onTalentDeselect={onDeselect}
        tooltipDirection="right"
      />
    </div>
  );
}
