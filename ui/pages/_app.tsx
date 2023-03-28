import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { em, MantineProvider } from '@mantine/core';
import { globalThemeColors } from '@/lib/style-constants';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
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
            xs: em(700),
            sm: em(1090),
            md: em(1475),
            lg: em(1650),
            xl: em(2700),
          },
          shadows: {
            xl: "0 0 15px -5px rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
}
