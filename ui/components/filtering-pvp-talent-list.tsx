import { PvpTalent } from '@/lib/talents'
import FilteringPvpTalent from './filtering-pvp-talent'

interface FilteringPvpTalentListProps {
  talents: PvpTalent[]
}

export default function FilteringPvpTalentList({
  talents
}: FilteringPvpTalentListProps) {
  return (
    <div>
      {talents.map(talent => (
        <FilteringPvpTalent
          key={talent.id}
          talent={talent}
        />
      ))}

    </div>
  );
}
