import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { em, MantineProvider } from '@mantine/core';
import { globalThemeColors } from '@/lib/style-constants';

export function reportWebVitals(metric: any): void {
  console.log(metric)
}

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <title>Moonkin Metrics</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'dark',
          colors: globalThemeColors(),
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
