import Layout from "@/components/layout/layout";
import SiteNav from "@/components/layout/site-nav";
import { Container, Stack, Title, useMantineTheme } from "@mantine/core";
import Head from "next/head";

export default function Bracket() {
  const theme = useMantineTheme();
  return (
    <Layout>
      <Head>
        <title>Moonkin Metrics</title>
        <meta name="description" content="World of Warcraft talent explorer for rated PvP." />
      </Head>
      <Container p="xl" size={theme.breakpoints.lg}>
        <Stack justify="center" align="center" spacing="xl">
          <Title align="center">Select a Specialization</Title>
          <SiteNav />
        </Stack>
      </Container>
    </Layout>
  );
}

