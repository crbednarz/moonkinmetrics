import { filterRatedLoadouts, LoadoutFilter } from "@/lib/loadout-filter";
import { getTalentTree, TalentNode, TalentTree } from "@/lib/talents";
import { Container, Stack, useMantineTheme, Text, Box, createStyles, rem, Flex, getStylesRef, Title, Divider, Button } from "@mantine/core";
import { GetStaticProps} from "next";
import { useState} from "react";
import { Faction, Leaderboard, RatedLoadout } from "@/lib/pvp";
import Layout from "@/components/layout/layout";
import FilteringNodeGroup from "@/components/tree/filtering-node-group";
import FilteringStatsPanel from "@/components/info-panel/filtering-stats-panel";
import Head from "next/head";
import Link from "next/link";

const useStyles = createStyles((theme) => ({
  card: {
    alignItems: 'center',
    padding: 25,
    gap: 50,
    width: "100%",
    flexDirection: 'row-reverse',
    '&:nth-of-type(odd)': {
      flexDirection: 'row',
      [`@media (max-width: ${theme.breakpoints.xs})`]: {
        flexDirection: 'column-reverse',
      },
      borderRadius: theme.radius.md,
      background: theme.colors.dark[6],
      [`& .${getStylesRef("demo")}`]: {
        background: theme.colors.dark[7],
      },
    },
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      flexDirection: 'column-reverse',
      justifyContent: 'center',
      gap: 10,
      padding: 5,
    },
  },
  cardDescription: {
    width: rem(765),
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      width: '100%',
      textAlign: 'center',
    },
  },
  demo: {
    ref: getStylesRef("demo"),
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.dark[6],
    borderRadius: theme.radius.md,
    minWidth: rem(300),
    minHeight: rem(250),
    width: '50%',
    alignSelf: 'stretch',
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      width: '100%',
    },
  },
  title: {
    fontSize: rem(34),
    fontWeight: 900,
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      fontSize: rem(24),
    },
  },
  siteDescription: {
    textAlign: 'center',
  },
  infoPanelCard: {
    gap: 25,
    padding: 25,
    width: '100%',
    justifyContent: 'center',
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      width: '100%',
      flexDirection: 'column-reverse',
      justifyContent: 'center',
      gap: 10,
      padding: 15,
    },
  },
  infoPanel: {
    width: 300,
    [`@media (max-width: ${theme.breakpoints.xs})`]: {
      width: '100%',
    },
  },
}));

interface TalentsProps {
  tree: TalentTree,
}

export default function Talents({
  tree,
}: TalentsProps) {
  const theme = useMantineTheme();
  const { classes } = useStyles();

  const { loadouts: demo1Loadouts, nodes: demo1Nodes } = createSampleData(tree, [
    {
      name: 'Armored to the Teeth',
      rank: i => {
        if (i < 15)
          return 1;
        if (i < 95)
          return 2;
        return 0;
      },
    },
  ]);

  const { loadouts: demo2Loadouts, nodes: demo2Nodes } = createSampleData(tree, [
    {
      name: 'Impale',
      rank: i => i < 90 ? 1 : 0,
    },
    {
      name: 'Exhilarating Blows',
      rank: i => i < 65 ? 1 : 0,
    },
    {
      name: 'Improved Sweeping Strikes',
      rank: i => i < 15 ? 1 : 0,
    },
    {
      name: 'Strength of Arms',
      rank: i => (i >= 15 && i < 85) ? 1 : 0,
    },
    {
      name: 'Cleave',
      rank: i => i < 20 ? 1 : 0,
    },
  ]);

  const { loadouts: demo3Loadouts, nodes: demo3Nodes } = createSampleData(tree, [
    {
      name: 'Tactician',
      rank: () => 1,
    },
    {
      name: 'Skullsplitter',
      rank: i => i < 85 ? 1 : 0,
    },
    {
      name: 'Rend',
      rank: i => i >= 20 ? 1 : 0,
    },
    {
      name: 'Improved Slam',
      rank: i => (i > 20 && i <= 25) ? 1 : 0,
    },
    {
      name: 'Tide of Blood',
      rank: i => i < 75 ? 1 : 0,
    },
    {
      name: 'Bloodborne',
      rank: i => i < 15 ? 1 : 2,
    },
    {
      name: 'Dreadnaught',
      rank: i => i > 35 ? 1 : 0,
    },
  ]);

  const guideData = [{
    nodes: demo1Nodes,
    loadouts: demo1Loadouts,
    title: "Hover over talents for details",
    text: "Hovering over a talent will display usage information by rank, tooltip text, and more.",
  }, {
    nodes: demo2Nodes,
    loadouts: demo2Loadouts,
    title: "Click talents to filter usage information",
    text: ("Left clicking on a talent will cycle through filters, limiting which players' loadouts are used based on talent selection.\n" +
           "Right clicking will clear any filters."),
  }];

  return (
    <Layout>
      <Head>
        <title>Moonkin Metrics</title>
        <meta name="description" content="World of Warcraft talent explorer for rated PvP." />
      </Head>
      <Container p="xl" size={theme.breakpoints.lg}>
        <Stack justify="center" align="center" spacing="xl">
          <Title size="3em" align="center" style={{fontFamily: "'Gabriela', serif"}}>Moonkin Metrics</Title>
          <Text size="lg" color="dimmed" className={classes.siteDescription}>
            Explore talent usage of the World of Warcraft PVP leaderboards.<br>
            </br>
            Supports 2v2, 3v3, Solo Shuffle, and Rated Battlegrounds.
          </Text>
          <Link href="/talents" passHref legacyBehavior>
            <Button
              component="a"
              size="xl"
              variant="filled"
            >
              Explore Talents
            </Button>
          </Link>
          <Divider my="xl" color="primary" w={200} />
          {guideData.map((guide, i) => (
            <DemoCard
              key={i}
              nodes={guide.nodes}
              loadouts={guide.loadouts}
              title={guide.title}
              text={guide.text}
            />
          ))}
          <Flex className={classes.card} style={{justifyContent: 'center'}}>
            <Box className={classes.cardDescription}>
              <Title order={2} size="2em" fw={500} mt="md" align="center">
                Explore and filter by rating
              </Title>
              <Text fz="md" c="dimmed" my="sm" align="center">
                The information panel displays statistics about the loadouts that match your filters. You can set a minimum and maximum rating to better understand your range.
              </Text>
            </Box>
          </Flex>
          <InfoPanelDemoCard
            nodes={demo3Nodes}
            loadouts={demo3Loadouts}
          />
          <Button onClick={() => scrollTo(0, 0)}>Scroll to top</Button>
        </Stack>
      </Container>
    </Layout>
  );
}


function InfoPanelDemoCard({
  nodes,
  loadouts,

}: {
  nodes: TalentNode[];
  loadouts: RatedLoadout[];

}) {
  let [filters, setFilters] = useState<LoadoutFilter[]>([]);
  let [ratingFilter, setRatingFilter] = useState<LoadoutFilter>();

  const minRating = loadouts[loadouts.length - 1].rating;
  const maxRating = loadouts[0].rating;
  let [ratingFilterRange, setRatingFilterRange] = useState<[number, number]>([
    Math.floor(minRating / 25) * 25,
    Math.ceil(maxRating / 25) * 25
  ]);
  let [resetCount, setResetCount] = useState<number>(0);

  const leaderboard = { entries: loadouts };
  const ratingFilteredLoadouts = filterRatedLoadouts(loadouts, ratingFilter ? [ratingFilter] : []);
  const filteredLoadouts = filterRatedLoadouts(ratingFilteredLoadouts, filters);

  const { classes } = useStyles();
  return (
    <Flex key={resetCount} className={classes.infoPanelCard}>
      <Box className={classes.demo} mr={15}>
        <FilteringNodeGroup
          onFiltersChange={filters => {
            setFilters(filters);
          }}
          nodes={nodes}
          loadouts={filteredLoadouts}
        />
      </Box>
      <Box className={classes.infoPanel}>
        <FilteringStatsPanel
          leaderboard={leaderboard}
          loadoutsInRatingRange={ratingFilteredLoadouts.length}
          filteredLoadouts={filteredLoadouts}
          minRating={ratingFilterRange[0]}
          maxRating={ratingFilterRange[1]}
          onRatingFilterChange={(min, max) => {
            setRatingFilterRange([min, max]);
            setRatingFilter(() => (loadout: RatedLoadout) => {
              return loadout.rating >= min && loadout.rating <= max;
            });
          }}
          onReset={() => {
            setRatingFilter(undefined);
            setFilters([]);
            setResetCount(resetCount + 1);
            setRatingFilterRange([
              Math.floor(minRating / 25) * 25,
              Math.ceil(maxRating / 25) * 25,
            ]);
          }}
          showTopPlayers={false}
        />
      </Box>
    </Flex>
  );

}

function DemoCard({
  nodes,
  loadouts,
  title,
  text,
}: {
  nodes: TalentNode[];
  loadouts: RatedLoadout[];
  title: string;
  text: string;
}) {
  let [filters, setFilters] = useState<LoadoutFilter[]>([]);
  const filteredLoadouts = filterRatedLoadouts(loadouts, filters);

  const { classes } = useStyles();
  return (
    <Flex className={classes.card}>
      <Box className={classes.demo} mr={15}>
        <FilteringNodeGroup
          onFiltersChange={filters => {
            setFilters(filters);
          }}
          nodes={nodes}
          loadouts={filteredLoadouts}
        />
      </Box>
      <Box className={classes.cardDescription}>
        <Title order={2} size="2em" fw={500} mt="md">
          {title}
        </Title>
        <Text fz="md" c="dimmed" my="sm">
          {text}
        </Text>
      </Box>
    </Flex>
  );
}

interface SampleTalentDescription {
  name: string,
  rank: (index: number, rating: number) => number,
}

function createSampleData(tree: TalentTree, talents: SampleTalentDescription[]) {
  const loadouts = new Array(100).fill({}).map<RatedLoadout>((_, i) => ({
      talents: {},
      pvpTalents: [],
      rating: 1800 + Math.round((99 - i)*(99 - i) / 15),
      region: (i % 2) == 0 ? 'eu' : 'us',
  }));

  const nodes = new Array<TalentNode>();
  for (let { name, rank } of talents) {
    const node = getNodeByTalentName(tree, name);
    const talentId = node.talents.find(talent => talent.name == name)!.id;
    for (let i = 0; i < loadouts.length; i++) {
      loadouts[i].talents[talentId] = rank(i, loadouts[i].rating);
    }

    if (nodes.find(n => n.id == node.id) == null) {
      nodes.push(node);
    }
  }
  return { loadouts, nodes };
}

function getNodeByTalentName(tree: TalentTree, talentName: string) {
  let node = [...tree.specNodes, ...tree.classNodes].find(node => {
    return node.talents.find(talent => talent.name == talentName) != null;
  });
  return node ?? tree.specNodes[0];
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const className = "Warrior";
  const specName = "Arms";
  const tree = getTalentTree(className, specName);

  return {
    props: {
      tree,
    }
  }
}

