import { useState } from 'react';
import { RatedLoadout } from '@/lib/pvp';
import { TalentNode, TalentTree } from '@/lib/talents';
import {
  filterRatedLoadouts,
  minRankFilter,
  rankZeroFilter,
  LoadoutFilter,
} from '@/lib/loadout-filter';
import styles from './talent-tree.module.scss';
import TalentNodeView from './talent-node';
import SubTalentTreeView from './sub-talent-tree';

enum NodeFilterMode {
  Zero,
  OneAndUp,
  TwoAndUp,
}

interface NodeFilter {
  mode: NodeFilterMode,
  selectedTalent: number,
  filter: LoadoutFilter,
}

type NodeFilterMap = {[key: number]: NodeFilter}

interface TalentTreeViewProps {
  tree: TalentTree;
  leaderboard: RatedLoadout[];
};

export default function TalentTreeView({ tree, leaderboard }: TalentTreeViewProps) {
  let [nodeFilters, setNodeFilters] = useState<NodeFilterMap>({});

  function updateNodeFilters(node: TalentNode, talentId: number) {
    const previousFilter = nodeFilters[node.id] ?? null;
    let nextNodeFilters = {...nodeFilters};

    if (!previousFilter) {
      nextNodeFilters[node.id] = {
        mode: NodeFilterMode.OneAndUp,
        selectedTalent: talentId,
        filter: minRankFilter(talentId, 1),
      };
      setNodeFilters(nextNodeFilters);
      return;
    }

    if (previousFilter.mode == NodeFilterMode.Zero) {
      delete nextNodeFilters[node.id];
      setNodeFilters(nextNodeFilters);
      return;
    }

    if (previousFilter.mode == NodeFilterMode.TwoAndUp || node.maxRank == 1) {
      nextNodeFilters[node.id] = {
        mode: NodeFilterMode.Zero,
        selectedTalent: talentId,
        filter: rankZeroFilter(talentId),
      }
      setNodeFilters(nextNodeFilters);
      return;
    }

    nextNodeFilters[node.id] = {
      mode: NodeFilterMode.TwoAndUp,
      selectedTalent: talentId,
      filter: minRankFilter(talentId, 2),
    }
    setNodeFilters(nextNodeFilters);
  }

  const loadouts = filterRatedLoadouts(
    leaderboard,
    Object.values<NodeFilter>(nodeFilters).map(f => f.filter), 
  );

  return (
    <>
      <h5>Viewing {loadouts.length} of {leaderboard.length} loadouts.</h5><br />
      {[tree.classNodes, tree.specNodes].map((nodes, subTreeIndex) => (
        <div key={subTreeIndex} className={styles.tree}>
          <div className={styles.innerTree}>
            {nodes.map(node => {
              let usage: { [key: number]: number[] } = {};
              usage = node.talents.reduce((usage, talent) => {
                usage[talent.id] = getTalentUsage(talent.id, loadouts);
                return usage;
              }, usage);
              let minimumRank = 0;
              switch (nodeFilters[node.id]?.mode) {
                case NodeFilterMode.OneAndUp:
                  minimumRank = 1;
                  break;
                case NodeFilterMode.TwoAndUp:
                  minimumRank = 2;
                  break;
              }
              return (
                <TalentNodeView
                  key={node.id}
                  node={node}
                  usage={usage}
                  disabled={nodeFilters[node.id]?.mode == NodeFilterMode.Zero}
                  selectedTalent={nodeFilters[node.id]?.selectedTalent}
                  minimumRank={minimumRank}
                  onTalentSelect={talentId => updateNodeFilters(node, talentId)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function getTalentUsage(talentId: number, loadouts: RatedLoadout[]) {
  const usageByRank = [0, 0, 0, 0];
  for (let entry of loadouts) {
    const rank = entry.talents[talentId] ?? 0;
    usageByRank[rank]++;
  }

  return usageByRank;
}

