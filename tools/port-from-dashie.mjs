#!/usr/bin/env node
/**
 * Port the dashieapp.com marketing site into getchickadee.org as `v2/`.
 *
 * WHY A SCRIPT AND NOT HAND-EDITS: ~97 "Dashie" occurrences across four pages plus
 * the shared header. Hand-editing that is unauditable and drifts the moment the
 * source changes. This is re-runnable: fix a rule, re-run, diff.
 *
 * WHY `v2/` AND NOT IN PLACE: voice.html, privacy.html and terms.html are already
 * REVIEWED Chickadee copy. Porting over them would destroy signed-off work, and
 * Dashie's legal pages describe a product with accounts and a subscription. The
 * legal pages are therefore NOT ported at all — the Chickadee ones stand.
 *
 * ORDER IS LOAD-BEARING in `TEXT`: "Hey Dashie" must be rewritten before the bare
 * "Dashie" rule, or it becomes "Hey Chickadee". Likewise the longer URL prefixes
 * before the shorter ones (`/dashie-kiosk-download` before `/dashie-kiosk`).
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SRC = '/Users/johnlerch/projects/dashieapp-website';
const DST = '/Users/johnlerch/projects/getchickadee-site/v2';

/**
 * Guides NOT ported, with the reason. Absent from this list = ported.
 * A named exclusion beats a hand-maintained include list: a new guide upstream
 * gets carried across by default rather than silently missed.
 */
const SKIP_GUIDES = {
  'dashie-lite-features': 'Dashie Lite is a Dashie product TIER. Chickadee has no tiers.',
};

/** source page -> ported page. Legal pages are deliberately absent. */
const PAGES = {
  'index.html': 'index.html',
  'dashie-kiosk.html': 'features.html',
  'voice-ai.html': 'voice.html',
  'dashie-kiosk-download.html': 'download.html',
  'components/header.js': 'components/header.js',
  'contact/index.html': 'contact/index.html',
  'guides/index.html': 'guides/index.html',
};

// Guides are discovered, not listed. Directory names carrying the brand are
// renamed the same way their inbound links are, or the links would 404.
for (const g of readdirSync(join(SRC, 'guides'), { withFileTypes: true })) {
  if (!g.isDirectory() || SKIP_GUIDES[g.name]) continue;
  const renamed = g.name.replace(/dashie/g, 'chickadee');
  PAGES[`guides/${g.name}/index.html`] = `guides/${renamed}/index.html`;
}

/** Applied in order. */
const TEXT = [
  // ── wake word first, or the generic rule below turns it into "Hey Chickadee"
  [/Hey,?\s+Dashie/g, 'Chickadee'],
  [/&ldquo;Dashie&rdquo;/g, '&ldquo;Chickadee&rdquo;'],

  // ── URLs: longest prefix first, and each ANCHORED to a URL terminator.
  //    Without the lookahead, `/dashie-kiosk` also matches inside the FILENAME
  //    `artwork/dashie-kiosk-lock-screen.png`, producing
  //    `/v2/artwork/v2/features-lock-screen.png`. That is not hypothetical — it
  //    happened on the first run and the asset-resolution check caught it.
  [/\/dashie-kiosk-download(?=["'#\s>])/g, '/v2/download'],
  [/\/dashie-kiosk(?=["'#\s>])/g, '/v2/features'],
  [/\/voice-ai(?=["'#\s>])/g, '/v2/voice'],
  [/\/privacy-policy\.html/g, '/privacy'],
  [/\/terms-of-service\.html/g, '/terms'],
  // Guides and contact move under /v2/ too. Matching the opening quote covers
  // both the href ("/guides/") and the getActiveClass argument ('/guides').
  [/(["'])\/guides/g, '$1/v2/guides'],
  [/(["'])\/contact/g, '$1/v2/contact'],
  [/https?:\/\/(www\.)?dashieapp\.com/g, 'https://getchickadee.org'],

  // ── marks. The bird icon stands in for the square Dashie mark; the wordmark
  //    for the full logo. Both are the SOLID variants: these render small in a
  //    header, which is inside the <=64px band where the soft art goes gray.
  [/\.?\/artwork\/Dashie_Full_Logo_Orange_Transparent\.png/g, '/assets/chickadee-logo.png'],
  [/\.?\/artwork\/Dashie_Logo_Orange_Transparent\.png/g, '/assets/chickadee-mark.png'],

  // ── remaining asset paths move under /v2/. ONE rule per directory matching
  //    BOTH the `./x/` and `/x/` forms: two separate rules would run in sequence
  //    and the second would match the `/v2/artwork/` the first just produced,
  //    yielding `/v2/v2/artwork/`.
  //    The guides sit two levels deep and reach assets with `../../artwork/`, so
  //    every relative depth has to normalise to the SAME absolute path — absolute
  //    is depth-independent, which is the only form that works from both the site
  //    root and guides/<name>/.
  [/(?:\/|(?:\.{1,2}\/)+)artwork\//g, '/v2/artwork/'],
  [/(?:\/|(?:\.{1,2}\/)+)website-assets\//g, '/v2/website-assets/'],
  [/(?:\/|(?:\.{1,2}\/)+)components\//g, '/v2/components/'],

  // ── product name, after every path rule above has run
  [/Dashie/g, 'Chickadee'],
  [/dashie/g, 'chickadee'],

  // ── carousel caption height (John, 2026-08-04: "way too tall").
  //    `.carousel-slides` is a flex ROW, so every slide stretches to the height
  //    of the TALLEST one. Inside each slide `.carousel-caption { flex: 1 }` then
  //    absorbs all of that leftover height — so a slide with a short image gets a
  //    caption box several times taller than its text. Sizing the caption to its
  //    content fixes it without touching the carousel's sliding behaviour.
  [/(\.carousel-caption\s*\{[^}]*?)flex:\s*1;/, '$1flex: 0 0 auto;'],
];

/**
 * Blocks removed wholesale. Each is [label, regex] so the run reports what it
 * took out — a silent removal is indistinguishable from a regex that stopped
 * matching after an upstream edit.
 *
 * Path-agnostic on purpose: these run BEFORE the TEXT rules, so the markup still
 * holds `./artwork/...`. Matching on the class name rather than the src keeps
 * them working whichever side of the rewrite they run on.
 */
const STRIP = [
  // The site claims "no analytics, no trackers" — see README.
  ['analytics include', /\s*<script[^>]*website-analytics\.js[^>]*>\s*<\/script>/g],
  ['analytics include', /\s*<script[^>]*src="[^"]*analytics[^"]*"[^>]*>\s*<\/script>/g],

  // John, 2026-08-04: drop the Home Assistant framing furniture. Chickadee IS a
  // Home Assistant product, so a badge announcing it is redundant here in a way
  // it was not on dashieapp.com, where HA was one mode among several.
  ['top-of-page HA banner', /\s*<div class="ha-banner-section">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g],
  ['hero "For Home Assistant" badge', /\s*<div class="hero-badge">[\s\S]*?<\/div>/g],
  ['header logo edition badge', /\s*<span class="logo-edition">[\s\S]*?<\/span>/g],
  // download.html builds the same badge from a DIFFERENT class (`hero-badges` >
  // `hero-badge-tag ha`), so the rule above walked straight past it and the badge
  // survived on that one page. Caught by grepping the rendered text rather than
  // trusting that one rule covered "the badge" everywhere.
  ['download-page HA badge', /\s*<div class="hero-badges">[\s\S]*?<\/div>/g],

  // John, 2026-08-04: drop Blog (no Chickadee blog) and the Download nav ITEM
  // (it is already a button top-right, so the menu entry is a duplicate).
  // ⚠️ These run BEFORE the TEXT rules, so they must match the SOURCE hrefs
  // (`/dashie-kiosk-download`), not the rewritten `/v2/download`.
  // ⚠️ The `<li>` wrapper is what distinguishes the nav ENTRY from the
  //    `btn-login` Download BUTTON, which stays. Matching on the href alone
  //    would remove both.
  ['nav: Blog', /\s*<li><a href="\/blog\/"[^>]*>Blog<\/a><\/li>/g],
  ['nav: Download entry', /\s*<li><a href="\/dashie-kiosk-download"[^>]*>Download<\/a><\/li>/g],
];

/** Nav entries with no Chickadee equivalent — reported, not silently dropped. */
const ORPHAN_LINKS = ['/guides', '/blog', '/contact', '/alpha-access'];

function port() {
  if (existsSync(DST)) rmSync(DST, { recursive: true });
  mkdirSync(DST, { recursive: true });

  const report = { pages: [], stripped: {}, orphans: {}, residualDashie: {} };

  for (const [src, dst] of Object.entries(PAGES)) {
    let s = readFileSync(join(SRC, src), 'utf8');
    const before = s.length;

    for (const [label, re] of STRIP) {
      const hits = s.match(re);
      if (hits) report.stripped[label] = (report.stripped[label] || 0) + hits.length;
      s = s.replace(re, '');
    }
    for (const [re, to] of TEXT) s = s.replace(re, to);

    // Anything still saying Dashie after every rule is a REAL finding, not noise.
    const left = s.match(/Dashie|dashie/g);
    if (left) report.residualDashie[dst] = left.length;

    const orph = ORPHAN_LINKS.filter((o) => s.includes(`href="${o}`));
    if (orph.length) report.orphans[dst] = orph;

    const out = join(DST, dst);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, s);
    report.pages.push({ dst, kb: (before / 1024).toFixed(1) });
  }

  // Copy ONLY the assets the ported pages actually reference.
  //
  // The first version copied both source directories wholesale: 104 files, 55 MB,
  // of which the four pages use twelve. Everything else was unused Dashie
  // marketing art, and a public repo's history is permanent — so the bulk copy
  // would have put 90-odd files nobody asked for beyond reach of a later delete.
  //
  // Names are rewritten to match the references (dashie-x.png -> chickadee-x.png),
  // so the reverse map is applied here to find the SOURCE file. A file with no
  // brand in its name (badge-google-play.png) maps to itself.
  const referenced = new Set();
  for (const dst of Object.values(PAGES)) {
    const s = readFileSync(join(DST, dst), 'utf8');
    for (const m of s.matchAll(/["'](\/v2\/(artwork|website-assets)\/[^"']+)["']/g)) {
      referenced.add(m[1].replace('/v2/', ''));
    }
  }

  report.assets = { copied: 0, missing: [] };
  for (const rel of referenced) {
    const dir = dirname(rel);
    const base = rel.slice(dir.length + 1);
    const candidates = [
      base.replace(/Chickadee/g, 'Dashie').replace(/chickadee/g, 'dashie'),
      base,
    ];
    const from = candidates.map((c) => join(SRC, dir, c)).find(existsSync);
    if (!from) {
      report.assets.missing.push(rel);
      continue;
    }
    const to = join(DST, rel);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
    report.assets.copied++;
  }

  return report;
}

const r = port();
console.log('ported pages:');
for (const p of r.pages) console.log(`   ${p.dst.padEnd(24)} (${p.kb} KB source)`);
console.log('\nblocks removed:', JSON.stringify(r.stripped));
console.log('residual "Dashie" after all rules:', JSON.stringify(r.residualDashie));
console.log('orphan nav links (no Chickadee equivalent):', JSON.stringify(r.orphans));
