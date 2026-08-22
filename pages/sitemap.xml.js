const SITE = 'https://horror-app-liard.vercel.app';

function generateSiteMap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE}/policy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap();
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
  return { props: {} };
}

export default function SiteMap() { return null; }
