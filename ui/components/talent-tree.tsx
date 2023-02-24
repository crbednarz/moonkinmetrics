import {RatedLoadout} from '@/lib/pvp';
import { CSSProperties } from 'react';
import { TalentTree } from '../lib/talents'

export default function TalentTreeView({
  tree,
  leaderboard 
}: { 
  tree: TalentTree,
  leaderboard: RatedLoadout[]
}) {
  return (
    <div>
      {tree.classNodes.map(node => {
        const x = node.x;
        const y = node.y;
        const style: CSSProperties = {
          'top': y * 600,
          'left': x * 600,
          'position': 'absolute',
          'width': 50,
          'height': 50,
          'background': `url(${node.talents[0].icon})`,
        };

        return (<div style={style} key={node.id}></div>);
      })}
      {tree.specNodes.map(node => {
        const x = node.x;
        const y = node.y;
        const style: CSSProperties = {
          'top': y * 600.0,
          'left': x * 600.0 + 700,
          'position': 'absolute',
          'width': 50,
          'height': 50,
          'background': `url(${node.talents[0].icon})`,
        };

        return (<div style={style} key={node.id}></div>);
      })}
    </div>
  );
}
