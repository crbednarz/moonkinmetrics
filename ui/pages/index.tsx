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


  const loadouts = new Array(100).fill({}).map<RatedLoadout>((_, i) => ({
      talents: {},
      pvpTalents: [],
      rating: 1800 + Math.round((99 - i)*(99 - i) / 15),
      region: (i % 2) == 0 ? 'eu' : 'us',
  }));

  // Demo 1
  const umbralEmbraceNode = getNode(tree, "Umbral Embrace");
  for (let i = 0; i < 15; i++)
    loadouts[i].talents[umbralEmbraceNode.talents[0].id] = 1;
  for (let i = 15; i < 95; i++)
    loadouts[i].talents[umbralEmbraceNode.talents[0].id] = 2;

  // Demo 2
  const starfallNode = getNode(tree, "Starfall");
  const solarBeamNode = getNode(tree, "Solar Beam");
  const fonNode = getNode(tree, "Force of Nature");
  const lightOfTheSunNode = getNode(tree, "Light of the Sun");
  for (let i = 0; i < 85; i++)
    loadouts[i].talents[solarBeamNode.talents[0].id] = 1;

  for (let i = 10; i < 85; i++)
    loadouts[i].talents[starfallNode.talents[0].id] = 1;

  for (let i = 25; i < 70; i++)
    loadouts[i].talents[fonNode.talents[0].id] = 1;
  for (let i = 70; i < 85; i++)
    loadouts[i].talents[fonNode.talents[1].id] = 1;

  for (let i = 0; i < 20; i++)
    loadouts[i].talents[lightOfTheSunNode.talents[0].id] = 1;

  const balanceOfAllThingsNode = getNode(tree, "Balance of All Things");
  const denizenOfTheDreamNode = getNode(tree, "Denizen of the Dream");
  const incarnationNode = getNode(tree, "Incarnation: Chosen of Elune");
  const friendOfTheFaeNode = getNode(tree, "Friend of the Fae");
  const elunesGuidanceNode = getNode(tree, "Elune's Guidance");
  for (let i = 0; i < 100; i++)
    loadouts[i].talents[balanceOfAllThingsNode.talents[0].id] = 2;

  for (let i = 0; i < 75; i++)
    loadouts[i].talents[denizenOfTheDreamNode.talents[0].id] = 1;

  for (let i = 20; i < 80; i++)
    loadouts[i].talents[incarnationNode.talents[0].id] = 1
  for (let i = 80; i < 100; i++)
    loadouts[i].talents[incarnationNode.talents[1].id] = 1;

  for (let i = 0; i < 40; i++)
    loadouts[i].talents[friendOfTheFaeNode.talents[0].id] = 1;

  for (let i = 25; i < 100; i++)
    loadouts[i].talents[elunesGuidanceNode.talents[0].id] = 1;

  const guideData = [{
    nodes: [umbralEmbraceNode],
    title: "Hover over talents for details",
    text: "Hovering over a talent will display usage information by rank, tooltip text, and more.",
  }, {
    nodes: [solarBeamNode, fonNode, lightOfTheSunNode, starfallNode],
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
              loadouts={loadouts}
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
            nodes={[balanceOfAllThingsNode, denizenOfTheDreamNode, incarnationNode, friendOfTheFaeNode, elunesGuidanceNode]}
            loadouts={loadouts}
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
          onRatingFilterChange={(min, max) => {
            setRatingFilter(() => (loadout: RatedLoadout) => {
              return loadout.rating >= min && loadout.rating <= max;
            });
          }}
          onReset={() => {
            setRatingFilter(undefined);
            setFilters([]);
            setResetCount(resetCount + 1);
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

function getNode(tree: TalentTree, talentName: string) {
  let node = [...tree.specNodes, ...tree.classNodes].find(node => {
    return node.talents.find(talent => talent.name == talentName) != null;
  });
  return node ?? tree.specNodes[0];
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const className = "Druid";
  const specName = "Balance";
  const tree = getTalentTree(className, specName);

  return {
    props: {
      tree,
    }
  }
}

