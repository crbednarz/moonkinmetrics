import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider, MantineThemeColorsOverride } from '@mantine/core';
import { CLASS_COLORS } from '@/lib/style-constants';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  const extraColors: MantineThemeColorsOverride = CLASS_COLORS;

  return (
    <>
      <Head>
        <title>Page title</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
          colors: extraColors,
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
}
