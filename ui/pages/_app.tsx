import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import { em, MantineProvider } from '@mantine/core';
import { globalThemeColors } from '@/lib/style-constants';
import Head from 'next/head';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, shrink-to-fit=yes" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          globalStyles: (theme) => ({
            'html,body': {
              minWidth: em(400),
            },
            body: {
              backgroundRepeatY: 'no-repeat',
              backgroundPosition: 'center top',
            },
          }),
          colorScheme: 'dark',
          primaryColor: 'primary',
          colors: globalThemeColors(),
          fontFamily: "'Open Sans', sans-serif",
          breakpoints: {
            xs: em(980),
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
