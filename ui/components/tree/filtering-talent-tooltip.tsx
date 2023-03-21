import {TalentNode} from "@/lib/talents";


export interface FilteringTalentTooltipProps {
  node: TalentNode;
}

export default function FilteringTalentTooltip({
  node,
}: FilteringTalentTooltipProps) {

  return (
    <div>
      {node.talents.map((talent) => {
        return (
          <div key={talent.id}>
            <div>{talent.name}</div>
          </div>
        );
      })}
    </div>
  );
}

