import { GetStaticPaths, GetStaticProps } from 'next';
import { Flex, MantineProvider, Title, createStyles, rem, MantineThemeColorsOverride, Tabs, Stack, useMantineTheme } from '@mantine/core';
import { CLASS_SPECS } from '@/lib/wow';
import { CLASS_COLORS, createThemeColors, globalThemeColors } from '@/lib/style-constants';
import { getTalentTree, TalentTree } from '@/lib/talents'
import { decodeLoadouts, getEncodedLeaderboard as getLeaderboardJson, LeaderboardTimestamp, RatedLoadout } from '@/lib/pvp'
import Layout from '@/components/layout/layout';
import TalentTreeExplorer from '@/components/tree/talent-tree-explorer';
import { useRouter } from 'next/router';
import {useMemo} from 'react';

const useStyles = createStyles(theme => ({
  title: {
    marginBottom: rem(10),
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    '& > h1': {
      marginRight: rem(10),
    },
    '& > div:last-child': {
      marginLeft: 'auto',
    },
    [`@media (max-width: ${theme.breakpoints.lg})`]: {
      justifyContent: 'left',
      '& > h1': {
        marginLeft: `${rem(10)} !important`,
      }
    }
  },
}));

export default function Bracket({
  tree,
  encodedLeaderboard,
  bracket,
  timestamp,
}: {
  tree: TalentTree,
  encodedLeaderboard: string[],
  bracket: string,
  timestamp: LeaderboardTimestamp,
}) {
  const leaderboard = useMemo<RatedLoadout[]>(() => {
    return decodeLoadouts(encodedLeaderboard, tree);
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
        primaryColor: 'primary',
      }}
    >
      <Layout>
        <Stack style={{display: 'inline-flex', maxWidth: '100%'}}>
          <Flex className={classes.title} justify="space-between">
            <Title>{tree.specName}</Title>
            <Title color="wow-class">{tree.className}</Title>
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
              </Tabs.List>
            </Tabs>
          </Flex>
          <TalentTreeExplorer
            tree={tree}
            timestamp={timestamp}
            leaderboard={leaderboard}
            key={`${tree.className}-${tree.specName}-${bracket}`}
          />
        </Stack>
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

  const leaderboardJson = getLeaderboardJson(className, specName, bracket.toLowerCase());

  const encodedLeaderboard = leaderboardJson['entries'] as string[];
  const timestamp = leaderboardJson['timestamp'] as LeaderboardTimestamp;

  return {
    props: {
      tree,
      encodedLeaderboard,
      bracket,
      timestamp,
    }
  }
}
