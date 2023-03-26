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
          globalStyles: (theme) => ({
            'html,body': {
              minWidth: em(1010),
            },
          }),
          colorScheme: 'dark',
          colors: globalThemeColors(),
          fontFamily: "'Open Sans', sans-serif",
          breakpoints: {
            xs: em(320),
            sm: em(1010),
            md: em(1225),
            lg: em(1650),
            xl: em(2700),
          },
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
    </>
  );
}
