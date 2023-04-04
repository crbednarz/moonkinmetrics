import { GetStaticPaths, GetStaticProps } from 'next';
import { Flex, MantineProvider, createStyles, rem, MantineThemeColorsOverride, Tabs } from '@mantine/core';
import { CLASS_SPECS } from '@/lib/wow';
import { CLASS_COLORS, createThemeColors, globalThemeColors } from '@/lib/style-constants';
import { getTalentTree, TalentTree } from '@/lib/talents'
import { decodeLeaderboard, EncodedLeaderboard, getEncodedLeaderboard, Leaderboard, LeaderboardTimestamp, RatedLoadout } from '@/lib/pvp'
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import Layout from '@/components/layout/layout';
import TalentTreeExplorer from '@/components/tree/talent-tree-explorer';
import Head from 'next/head';
import SpecSelector from '@/components/layout/spec-selector';
import SiteNavbar from '@/components/layout/site-navbar';

const useStyles = createStyles(theme => ({
  contentGrid: {
    display: 'grid',
    justifyContent: 'center',
    gridTemplateColumns: '[nav-bar] min-content [content] min-content',
    gridTemplateRows: '[title-bar] min-content [content] auto',
    marginBottom: 25,
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      display: 'flex',
      flexDirection: 'column',
    }
  },
  nav: {
    gridColumn: 'nav-bar',
    gridRow: 'content',
    [`@media (max-width: ${theme.breakpoints.lg})`]: {
      display: 'none',
    }
  },
  content: {
    gridColumn: 'content',
    gridRow: 'content',
  },
  title: {
    gridRow: 'title-bar',
    gridColumn: 'content',
    flexWrap: 'wrap',
    marginBottom: rem(5),
    justifyContent: 'space-between',
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      justifyContent: 'center',
      overflow: 'hidden',
    },
  },
}));

export default function Bracket({
  tree,
  encodedLeaderboard,
  bracket,
}: {
  tree: TalentTree,
  encodedLeaderboard: EncodedLeaderboard,
  bracket: string,
}) {
  const leaderboard = useMemo<Leaderboard>(() => {
    return decodeLeaderboard(encodedLeaderboard, tree);
  }, [encodedLeaderboard, tree]);

  const classSlug = tree.className.toLowerCase().replace(' ', '-');
  const extraColors: MantineThemeColorsOverride = {
    'wow-class': createThemeColors(CLASS_COLORS[classSlug]),
  };

  const { classes } = useStyles();
  const router = useRouter();
  return (
    <MantineProvider
      inherit
      theme={{
        colors: {
          ...globalThemeColors(),
          ...extraColors,
        },
      }}
    >
      <Head>
        <title>{`${bracket} - ${tree.specName} ${tree.className} | Moonkin Metrics`}</title>
        <meta name="description" content={`Explore talent selection of ${tree.specName} ${tree.className} in rated ${bracket}.`} />
      </Head>
      <Layout>
        <div className={classes.contentGrid}>
          <Flex className={classes.title} justify="space-between" align="center">
            <SpecSelector />
            <Tabs
              value={bracket as string}
              onTabChange={value => {
                const classParam = router.query['class_name'];
                const specParam = router.query['spec_name'];

                router.push(`/${classParam}/${specParam}/${value}`)
              }}
              variant="pills"
            >
              <Tabs.List sx={() => ({
                '& span': {
                  fontSize: rem(22),
                }
              })}>
                <Tabs.Tab value="Shuffle">Solo Shuffle</Tabs.Tab>
                <Tabs.Tab value="3v3">3v3</Tabs.Tab>
                <Tabs.Tab value="2v2">2v2</Tabs.Tab>
                <Tabs.Tab value="RBG">RBG</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Flex>
          <div className={classes.nav}>
              <SiteNavbar/>
          </div>
          <div className={classes.content}>
            <TalentTreeExplorer
              tree={tree}
              leaderboard={leaderboard}
              key={`${tree.className}-${tree.specName}-${bracket}`}
            />
          </div>
        </div>
      </Layout>
    </MantineProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
    let paths = ['RBG', '3v3', '2v2', 'Shuffle'].map(bracket => (
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
  const encodedLeaderboard = getEncodedLeaderboard(className, specName, bracket.toLowerCase());

  return {
    props: {
      tree,
      encodedLeaderboard,
      bracket,
    }
  }
}
