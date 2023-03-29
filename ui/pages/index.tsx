import Layout from "@/components/layout/layout";
import SiteNav from "@/components/layout/site-nav";
import { Center, Container, createStyles, Stack, Title } from "@mantine/core";
import Head from "next/head";

const useStyles = createStyles(() => ({
}));

export default function Bracket() {
  const { classes } = useStyles();
  return (
    <Layout>
      <Head>
        <title>Moonkin Metrics</title>
        <meta name="description" content="World of Warcraft talent explorer for rated PvP." />
      </Head>
      <Container p='xl'>
        <Stack justify="center" align="center" spacing="xl">
          <Title>Moonkin Metrics</Title>
          <SiteNav />
        </Stack>
      </Container>
    </Layout>
  );
}

