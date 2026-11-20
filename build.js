// Builds the site's pages from one source file.
//
//   Edit:  src/site.html   (every page lives in it as <main data-view="...">)
//   Run:   node build.js
//   Makes: index.html, brokers.html, customers.html ... (one per page)
//          site.css and assets/site.js (shared by every page)
//
// Each page file gets the shared header, menu, footer and claim pop-up, plus only its own <main>.
// Links use addresses without ".html" (e.g. "brokers"), which GitHub Pages serves as brokers.html.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://olisabdelite.github.io/bdelite-website-preview/'; // change to the final domain at launch

// page key -> [title, description]
const PAGES = {
  home: ['BDElite | Total claims management and add-on insurance for UK brokers', 'Legal expenses, breakdown, home emergency and total claims management, sold through UK insurance brokers and handled by our own team in Bolton.'],
  brokers: ['LEI and add-ons for insurance brokers | BDElite', 'Legal expenses and add-on products that quote and bind by EDI in Acturis, Open GI and SSP, backed by total claims management from our Bolton team.'],
  customers: ['Make a claim or check your cover | BDElite', 'Make a claim on the motor claimsline 01204 567 567, or find out who BDElite are and what the cover your broker arranged includes.'],
  fleet: ['Fleet legal expenses, breakdown and claims management | BDElite', 'Fleet legal expenses, breakdown for cars, vans and HGVs up to 44 tonnes, and total claims management, arranged through your insurance broker.'],
  about: ['About BDElite | Bolton-based total solutions provider', 'Founded in Bolton in 2011, BDElite provides add-on insurance products, claims management and replacement vehicle solutions to 400+ broker accounts.'],
  faq: ['FAQs | BDElite', 'Answers to common questions about making a claim, your BDElite cover, breakdown, home emergency, key tags, and working with us as a broker or fleet.'],
  'key-recovery': ['Key tag registration | BDElite Key Recovery', "Register your BDElite Key Recovery tag so we can return your keys if they're lost and handed in."],
  accessibility: ['Extra support and accessibility | BDElite', "If you need extra help with your policy or claim, tell us and we'll adapt how we work with you. Plus how we make this website accessible."],
  careers: ['Careers at BDElite | Jobs in Bolton', "Work for BDElite in Bolton. We're always looking for talented people in claims, product and technology."],
  'complaints-procedure': ['Complaints procedure | BDElite', 'How to make a complaint to BDElite, what happens next, and how to contact the Financial Ombudsman Service.'],
  'privacy-statement': ['Privacy statement | BDElite', 'How BDElite collects, uses, shares and protects your personal information, and your data protection rights.'],
  cookies: ['Cookies | BDElite', 'How the BDElite website uses cookies and similar technologies, and how to control them.'],
  'fca-authorisation': ['FCA authorisation | BDElite', 'BDElite Ltd is authorised and regulated by the Financial Conduct Authority, firm reference number 797920.'],
};

// Tells search engines who we are (same on every page).
const ORG = {
  '@context': 'https://schema.org', '@type': 'InsuranceAgency', name: 'BDElite', legalName: 'BDElite Ltd', url: SITE,
  email: 'bdelite.admin@bdelite.co.uk', telephone: '+44 1204 567 500', foundingDate: '2011', vatID: 'GB895086868',
  address: { '@type': 'PostalAddress', streetAddress: 'Atria, Spa Road', addressLocality: 'Bolton', postalCode: 'BL1 4AG', addressCountry: 'GB' },
  sameAs: ['https://www.linkedin.com/company/bdelite', 'https://www.facebook.com/BDEliteTCM'],
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'claims', telephone: '+44 1204 567 567', areaServed: 'GB' },
    { '@type': 'ContactPoint', contactType: 'emergency', name: 'Breakdown', telephone: '+44 1204 567 497' },
    { '@type': 'ContactPoint', contactType: 'emergency', name: 'Home emergency', telephone: '+44 1204 567 499' },
    { '@type': 'ContactPoint', contactType: 'sales', telephone: '+44 1204 567 500' },
  ],
};

const esc = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cut = (s, a, b, from = 0) => { const i = s.indexOf(a, from); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return [i, j + b.length]; };

const src = fs.readFileSync(path.join(ROOT, 'src', 'site.html'), 'utf8').replace(/\r\n/g, '\n');

// 1. split the source into its parts
const [cs, ce] = cut(src, '\n<style>\n', '\n</style>\n');
const [js, je] = cut(src, '\n<script>\n', '\n</script>\n', ce);
const pre = src.slice(0, cs);
const baseCss = (pre.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const themeScript = pre.match(/<script>\(function\(\)\{var k="bde-theme"[\s\S]*?<\/script>/)[0];
// The stylesheet sits next to the pages (not in assets/) on purpose: photos are set on the page as
// --img:url('img/...') and browsers look those up from the stylesheet's folder, so both must match.
const css = baseCss + '\n' + src.slice(cs + '\n<style>\n'.length, ce - '\n</style>\n'.length);
const script = src.slice(js + '\n<script>\n'.length, je - '\n</script>\n'.length);
const body = src.slice(ce, js);

// 2. shared files
fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
fs.rmSync(path.join(ROOT, 'assets', 'site.css'), { force: true }); // old location
fs.writeFileSync(path.join(ROOT, 'site.css'), '/* Generated by build.js from src/site.html. Edit the source, not this file. */\n' + css);
fs.writeFileSync(path.join(ROOT, 'assets', 'site.js'), '/* Generated by build.js from src/site.html. Edit the source, not this file. */\n' + script);

// 3. one HTML file per page
const MAIN_RE = /\n(?:<!--[^\n]*-->\n)?<main data-view="([a-z-]+)"( hidden)?>[\s\S]*?\n<\/main>\n/g;
const found = [...body.matchAll(MAIN_RE)].map(m => m[1]);
const missing = found.filter(k => !PAGES[k]).concat(Object.keys(PAGES).filter(k => !found.includes(k)));
if (missing.length) throw new Error('Page list and src/site.html disagree: ' + missing.join(', '));

for (const [key, [title, desc]] of Object.entries(PAGES)) {
  const file = key === 'home' ? 'index.html' : key + '.html';
  const url = SITE + (key === 'home' ? '' : key);
  const own = body.replace(MAIN_RE, (m, k) => k === key ? m.replace(' hidden>', '>') : '\n');
  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}img/fleet.jpg">
${themeScript}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=swap">
<link rel="stylesheet" href="site.css">
<script type="application/ld+json">${JSON.stringify(ORG)}</script>
</head>
<body data-page="${key}" data-view="${key}">
<!-- Generated by build.js from src/site.html. Edit the source, then run: node build.js -->
${own.trim()}
<script src="assets/site.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log(file.padEnd(28), Math.round(html.length / 1024) + ' KB');
}
console.log('site.css'.padEnd(28), Math.round(css.length / 1024) + ' KB');
console.log('assets/site.js'.padEnd(28), Math.round(script.length / 1024) + ' KB');
