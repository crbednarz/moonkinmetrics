import Layout from "@/components/layout/layout";
import { Center, createStyles } from "@mantine/core";
import Head from "next/head";

const useStyles = createStyles(() => ({
}));

export default function Bracket() {
  const { classes } = useStyles();
  return (
    <Layout>
      <Head>
        <title>Moonkin Metrics</title>
      </Head>
      <Center p='xl'>
        <h1>
          Home page under construction.<br/>Please use the navigation bar to explore the site.
        </h1>
      </Center>
    </Layout>
  );
}

