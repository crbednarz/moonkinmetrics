import { PvpTalent } from '@/lib/talents'

interface FilteringPvpTalentProps {
  talent: PvpTalent
}

export default function FilteringPvpTalent({
  talent
}: FilteringPvpTalentProps) {

  return (
    <div>
      {talent.spellName}
    </div>
  );
}
