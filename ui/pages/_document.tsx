import { createGetInitialProps } from '@mantine/next';
import Document, { Html, Head, Main, NextScript } from 'next/document';

const getInitialProps = createGetInitialProps();

export default class _Document extends Document {
  static getInitialProps = getInitialProps;

  render() {
    return (
    <Html lang="en">
      <Head>
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* eslint-disable-next-line @next/next/google-font-display */}
        <link href="https://fonts.googleapis.com/css2?family=Gabriela&family=Open+Sans:wght@500;700&display=fallback" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>

    );
  }
}
