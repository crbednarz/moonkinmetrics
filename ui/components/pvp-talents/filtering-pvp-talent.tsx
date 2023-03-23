import { TalentFilterMode } from '@/lib/loadout-filter';
import { Talent } from '@/lib/talents'
import { TalentUsage } from '@/lib/usage';
import FilteringTalent from '../tree/filtering-talent';

interface FilteringPvpTalentProps {
  talent: Talent;
  usage: TalentUsage;
  filterMode: TalentFilterMode;
  onSelect: (talent: Talent) => void;
  onDeselect: (talent: Talent) => void;
}

export default function FilteringPvpTalent({
  talent,
  usage,
  filterMode,
  onSelect,
  onDeselect,
}: FilteringPvpTalentProps) {
  return (
    <div style={{ display: 'inline-block', margin: 5 }}>
      <FilteringTalent
        talentsData={[{
          talent,
          usage,
          filterMode,
        }]}
        usage={usage.percent}
        onTalentSelect={onSelect}
        onTalentDeselect={onDeselect}
        tooltipDirection="right"
      />
    </div>
  );
}
