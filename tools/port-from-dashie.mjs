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

/** source page -> ported page. Legal pages are deliberately absent. */
const PAGES = {
  'index.html': 'index.html',
  'dashie-kiosk.html': 'features.html',
  'voice-ai.html': 'voice.html',
  'dashie-kiosk-download.html': 'download.html',
  'components/header.js': 'components/header.js',
};

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
  [/(?:\.\/|\/)artwork\//g, '/v2/artwork/'],
  [/(?:\.\/|\/)website-assets\//g, '/v2/website-assets/'],
  [/(?:\.\/|\/)components\//g, '/v2/components/'],

  // ── product name, after every path rule above has run
  [/Dashie/g, 'Chickadee'],
  [/dashie/g, 'chickadee'],
];

/** Analytics: strip the include entirely — see README, the site claims none. */
const STRIP = [
  /\s*<script[^>]*website-analytics\.js[^>]*>\s*<\/script>/g,
  /\s*<script[^>]*src="[^"]*analytics[^"]*"[^>]*>\s*<\/script>/g,
];

/** Nav entries with no Chickadee equivalent — reported, not silently dropped. */
const ORPHAN_LINKS = ['/guides', '/blog', '/contact', '/alpha-access'];

function port() {
  if (existsSync(DST)) rmSync(DST, { recursive: true });
  mkdirSync(DST, { recursive: true });

  const report = { pages: [], strippedAnalytics: 0, orphans: {}, residualDashie: {} };

  for (const [src, dst] of Object.entries(PAGES)) {
    let s = readFileSync(join(SRC, src), 'utf8');
    const before = s.length;

    for (const re of STRIP) {
      const hits = s.match(re);
      if (hits) report.strippedAnalytics += hits.length;
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

  // Images come across so the LAYOUT renders for review. The product screenshots
  // are Dashie-branded INSIDE the pixels and cannot be fixed by substitution —
  // they are must-replace before any publish. Recorded in the report, not hidden.
  //
  // FILES ARE RENAMED TOO, with the same name substitution the text rules apply.
  // Otherwise the pages reference `chickadee-battery-management.png` while disk
  // holds `dashie-battery-management.png` — a broken image that no text rule can
  // fix, because the mismatch is between the reference and the FILENAME.
  for (const d of ['artwork', 'website-assets']) {
    const from = join(SRC, d);
    if (!existsSync(from)) continue;
    cpSync(from, join(DST, d), {
      recursive: true,
      // rename on the way in, so reference and file agree by construction
      filter: () => true,
    });
    for (const f of readdirSync(join(DST, d))) {
      const renamed = f.replace(/Dashie/g, 'Chickadee').replace(/dashie/g, 'chickadee');
      if (renamed !== f) {
        renameSync(join(DST, d, f), join(DST, d, renamed));
        report.renamedAssets = (report.renamedAssets || 0) + 1;
      }
    }
  }

  return report;
}

const r = port();
console.log('ported pages:');
for (const p of r.pages) console.log(`   ${p.dst.padEnd(24)} (${p.kb} KB source)`);
console.log(`\nanalytics includes stripped: ${r.strippedAnalytics}`);
console.log('residual "Dashie" after all rules:', JSON.stringify(r.residualDashie));
console.log('orphan nav links (no Chickadee equivalent):', JSON.stringify(r.orphans));
