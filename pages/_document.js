import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="hi">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#ff6600" />
        <meta name="description" content="साया - डरावनी हिंदी कहानियाँ। Hindi horror stories audio & text. Bhoot ki kahaniya, chudail ki kahani, haunted stories in Hindi. Suno aur padho FREE!" />
        <meta name="keywords" content="hindi horror story, bhoot ki kahani, darawani kahaniya, hindi horror audio story, chudail ki kahani, haunted story hindi, horror story in hindi, डरावनी कहानियां, भूत की कहानी, हॉरर स्टोरी" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="साया - खौफ़ की हिंदी कहानियाँ 👻 | Hindi Horror Stories" />
        <meta property="og:description" content="डरावनी हिंदी कहानियाँ - सुनो और पढ़ो FREE। अकेले मत सुनना... Bhoot, chudail, haunted haveli ki stories!" />
        <meta property="og:image" content="https://horror-app-liard.vercel.app/icon.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://horror-app-liard.vercel.app" />
        <meta property="og:locale" content="hi_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="साया - खौफ़ की हिंदी कहानियाँ 👻" />
        <meta name="twitter:description" content="डरावनी हिंदी कहानियाँ - सुनो और पढ़ो FREE!" />
        <meta name="twitter:image" content="https://horror-app-liard.vercel.app/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="साया" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "साया - Saaya Horror Stories",
          "alternateName": "Saaya - Hindi Horror Stories",
          "url": "https://horror-app-liard.vercel.app",
          "description": "Hindi horror stories - audio aur text. Bhoot, chudail, haunted stories.",
          "inLanguage": "hi"
        }) }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
