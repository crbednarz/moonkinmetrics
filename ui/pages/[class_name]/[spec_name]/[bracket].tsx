import { GetStaticPaths, GetStaticProps } from 'next'
import { CLASS_SPECS } from '@/lib/wow'
import { getTalentTree, TalentTree } from '@/lib/talents'
import { getLeaderboard, RatedLoadout } from '@/lib/pvp'
import  TalentTreeExplorer from '@/components/talent-tree-explorer';
import  Layout from '@/components/layout';
import Head from 'next/head';

export default function Bracket({
  tree,
  leaderboard,
  bracket,
}: {
  tree: TalentTree,
  leaderboard: RatedLoadout[],
  bracket: string,
}) {
  return (
    <Layout className={tree.className.replace(' ', '-').toLowerCase()}>
      <Head>
      </Head>
      <span className="class-text class-name">
        {tree.className}
      </span>
      <span className="spec-name">
        &nbsp;{tree.specName}
      </span>
      <span className="bracket">
        {bracket}
      </span>
      <br/>
      <TalentTreeExplorer tree={tree} leaderboard={leaderboard} />
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
    let paths = ['3v3', '2v2', 'Shuffle'].map(bracket => (
      CLASS_SPECS.map(classSpec => ({
      params: {
        class_name: classSpec.className.replace(' ', '-'),
        spec_name: classSpec.specName.replace(' ', '-'),
        bracket: bracket,
      }
    }))
  )).flat(1);

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
  const leaderboard = getLeaderboard(className, specName, bracket.toLowerCase());

  return {
    props: {
      tree,
      leaderboard,
      bracket,
    }
  }
}
