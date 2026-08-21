import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="hi">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#ff6600" />
        <meta name="description" content="डर सिर्फ एक कहानी की दूरी पर है... Hindi horror stories - suno aur padho!" />
        <meta property="og:title" content="साया - खौफ़ की हिंदी कहानियाँ 👻" />
        <meta property="og:description" content="डरावनी हिंदी कहानियाँ - सुनो और पढ़ो। अकेले मत सुनना..." />
        <meta property="og:image" content="https://horror-app-liard.vercel.app/icon.png" />
        <meta property="og:type" content="website" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="साया" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
