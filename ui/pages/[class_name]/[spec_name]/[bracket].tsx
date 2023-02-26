import { GetStaticPaths, GetStaticProps } from 'next'
import { CLASS_SPECS } from '@/lib/wow'
import { getTalentTree, TalentTree } from '@/lib/talents'
import { getLeaderboard, RatedLoadout } from '@/lib/pvp'
import  TalentTreeExplorer from '@/components/talent-tree-explorer';
import  Layout from '@/components/layout';

export default function Bracket({
  tree,
  leaderboard
}: {
  tree: TalentTree,
  leaderboard: RatedLoadout[]
}) {
  return (
    <Layout>
      <h1>
        {tree.className} - {tree.specName}
      </h1>
      <br/>
      <TalentTreeExplorer tree={tree} leaderboard={leaderboard} />
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  let paths = CLASS_SPECS.map(classSpec => {
    return {
      params: {
        class_name: classSpec.className.replace(' ', '-'),
        spec_name: classSpec.specName.replace(' ', '-'),
        bracket: '3v3',
      }
    }
  });
  
  return {
    paths,
    fallback: false,
  }
}


export const getStaticProps: GetStaticProps = async ({ params }) => {
  const className = (params!['class_name'] as string).replace('-', ' ');
  const specName = (params!['spec_name'] as string).replace('-', ' ');
  const tree = getTalentTree(className, specName);

  const bracket = params!['bracket'] as string;
  const leaderboard = getLeaderboard(className, specName, bracket);

  return {
    props: {
      tree,
      leaderboard,
    }
  }
}
