import { GetStaticPaths, GetStaticProps } from 'next';
import { Flex, MantineProvider, Title, createStyles, rem, MantineThemeColorsOverride } from '@mantine/core';
import { CLASS_SPECS } from '@/lib/wow';
import { CLASS_COLORS } from '@/lib/style-constants';
import { getTalentTree, TalentTree } from '@/lib/talents'
import { getLeaderboard, RatedLoadout } from '@/lib/pvp'
import Layout from '@/components/layout/layout';
import TalentTreeExplorer from '@/components/tree/talent-tree-explorer';
import InfoPanel from '@/components/info-panel/info-panel';
import RatingGraph from '@/components/info-panel/rating-graph';

const useStyles = createStyles(theme => ({
  title: {
    marginBottom: rem(10),
    flexWrap: 'wrap',
    '& > h1': {
      marginRight: rem(10),
      '&:last-child': {
        marginLeft: 'auto',
        marginRight: 0,
      },
    },
    [`@media (max-width: ${theme.breakpoints.sm})`]: {
      justifyContent: 'left',
      '& > h1': {
        marginLeft: `${rem(10)} !important`,
      }
    }
  },
}));

export default function Bracket({
  tree,
  leaderboard,
  bracket,
}: {
  tree: TalentTree,
  leaderboard: RatedLoadout[],
  bracket: string,
}) {
  const classSlug = tree.className.toLowerCase().replace(' ', '-');
  const extraColors: MantineThemeColorsOverride = {
    'wow-class': CLASS_COLORS[classSlug],
    ...CLASS_COLORS,
  };
  const { classes } = useStyles();
  return (
    <MantineProvider
      inherit
      theme={{
        colors: extraColors
      }}
    >
      <Layout>
        <Flex className={classes.title} justify="space-between">
          <Title>{tree.specName}</Title>
          <Title color="wow-class">{tree.className}</Title>
          <Title>{bracket}</Title>
        </Flex>
        <div>
          <TalentTreeExplorer tree={tree} leaderboard={leaderboard} />
        </div>
      </Layout>
    </MantineProvider>
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
