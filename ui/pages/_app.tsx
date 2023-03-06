import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { em, MantineProvider, MantineThemeColorsOverride, rem } from '@mantine/core';
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
          breakpoints: {
            xs: em(320),
            sm: em(775),
            md: em(1225),
            lg: em(1500),
            xl: em(2250),
          },
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
}