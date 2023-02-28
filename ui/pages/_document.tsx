import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    const whTooltips = {
      colorLinks: true,
      iconizeLinks: true,
      renameLinks: true
    };
    return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@500&display=swap" rel="stylesheet" />
        <script id="configure-tooltips">
          {`const whTooltips = {colorLinks: false, iconizeLinks: false, renameLinks: false};`}
        </script>
        <script src="https://wow.zamimg.com/js/tooltips.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
