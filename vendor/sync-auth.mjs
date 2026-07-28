#!/usr/bin/env node
// vendor/sync-auth.mjs — vendor the Dashie mobile-auth device-flow pages into
// this site, brand-fixed to Chickadee and env-selectable on a single origin.
//
// WHY THIS EXISTS (the seam, not a bare fork): these pages share the
// device-flow / OAuth contract with Dashie's copies in dashieapp_staging
// (js/data/auth/mobile-auth). Rather than hand-fork them, this script COPIES
// from the source of truth and applies a small set of ANCHORED transforms.
// Every transform must match its anchor exactly once, or the script THROWS —
// so if the upstream pages drift, this fails loudly instead of silently
// shipping stale auth code. See vendor/VENDORED.md and the JS_KOTLIN_CONTRACTS
// row for the shared contract.
//
// Usage:  node vendor/sync-auth.mjs           (source: ../../dashieapp_staging)
//         DASHIE_STAGING=/path node vendor/sync-auth.mjs
//
// Re-run whenever the upstream mobile-auth pages change; commit the result.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const SRC_ROOT = process.env.DASHIE_STAGING
  ? resolve(process.env.DASHIE_STAGING)
  : resolve(SCRIPT_DIR, '../../dashieapp_staging');

// ---- anchored-transform helpers (fail loud) --------------------------------

function hardReplace(content, anchor, replacement, label) {
  const parts = content.split(anchor);
  if (parts.length === 1) {
    throw new Error(`[sync-auth] ANCHOR MISS (${label}): upstream no longer contains:\n---\n${anchor}\n---\nThe source drifted. Update vendor/sync-auth.mjs to match, then re-run.`);
  }
  if (parts.length > 2) {
    throw new Error(`[sync-auth] ANCHOR AMBIGUOUS (${label}): matched ${parts.length - 1}× (expected 1).`);
  }
  return parts.join(replacement);
}

// path rewrites that legitimately appear more than once and may be absent
function softReplaceAll(content, find, replacement) {
  return content.split(find).join(replacement);
}

function header(relPath, commentStyle) {
  const body = [
    `GENERATED — vendored from dashieapp_staging by vendor/sync-auth.mjs.`,
    `Do NOT edit here; edit the source and re-run \`node vendor/sync-auth.mjs\`.`,
    `Source: ${relPath}`,
  ];
  if (commentStyle === 'html') return `<!-- ${body.join(' ')} -->\n`;
  return body.map((l) => `// ${l}`).join('\n') + '\n\n';
}

// ---- the env resolver injected into auth-config.js -------------------------

const CHICKADEE_ENV_RESOLVER = `// [VENDORED — getchickadee.org] URL-param environment resolver. Replaces the
// hostname sniff below: a single origin can't tell staging from prod by host,
// so environment rides ?env= on the URL, persisted across the OAuth round-trip
// in sessionStorage (Google's callback carries no query we control).
const CHICKADEE_ENV_KEY = 'chickadee_auth_env';
function resolveChickadeeEnvConfig() {
  let env = null;
  try {
    const q = new URLSearchParams(window.location.search).get('env');
    if (q) {
      const v = q.toLowerCase();
      if (v === 'staging' || v === 'dev' || v === 'development' || v === 'beta') env = 'development';
      else if (v === 'prod' || v === 'production' || v === 'stable') env = 'production';
      else console.warn(\`DROP: getchickadee auth ?env='\${q}' unrecognized; using production\`);
      if (env) { try { sessionStorage.setItem(CHICKADEE_ENV_KEY, env); } catch (_) {} }
    }
    if (!env) env = sessionStorage.getItem(CHICKADEE_ENV_KEY) || 'production';
  } catch (_) { env = 'production'; }
  return SUPABASE_ENVIRONMENTS[env] || SUPABASE_ENVIRONMENTS.production;
}

`;

// ---- per-file transforms ---------------------------------------------------

const AUTH = 'js/data/auth';
const MA = `${AUTH}/mobile-auth`;

const FILES = [
  {
    src: `${AUTH}/auth-config.js`,
    dest: 'auth/data/auth/auth-config.js',
    comment: 'js',
    transform(c) {
      // Inject the resolver just above the hostname-based detector.
      c = hardReplace(
        c,
        '// Auto-detect environment based on domain\n',
        CHICKADEE_ENV_RESOLVER + '// Auto-detect environment based on domain\n',
        'auth-config: inject resolver',
      );
      // Replace the hostname sniff with a call to the resolver.
      c = hardReplace(
        c,
        `  const host = window.location.hostname;\n` +
          `  // Use dev database for: dev.dashieapp.com, local.dashieapp.com, localhost, 127.0.0.1\n` +
          `  if (host.includes('dev.') || host.includes('local.') || host === 'localhost' || host.startsWith('localhost') || host.startsWith('127.0.0.1')) {\n` +
          `    return SUPABASE_ENVIRONMENTS.development;\n` +
          `  }\n\n` +
          `  return SUPABASE_ENVIRONMENTS.production;`,
        `  // [VENDORED — getchickadee.org] Single origin: env from ?env= (see above).\n` +
          `  return resolveChickadeeEnvConfig();`,
        'auth-config: replace hostname sniff',
      );
      return c;
    },
  },
  {
    src: `${MA}/brand-config.js`,
    dest: 'auth/data/auth/mobile-auth/brand-config.js',
    comment: 'js',
    transform(c) {
      // Default brand → chickadee (no ?brand= on this origin).
      c = hardReplace(
        c,
        `  return BRANDS[id || 'dashie'] || BRANDS.dashie;`,
        `  return BRANDS[id || 'chickadee'] || BRANDS.chickadee;`,
        'brand-config: default→chickadee',
      );
      // Chickadee logo path → this site's asset.
      c = hardReplace(
        c,
        `    logoSrc: '/artwork/Chickadee_Full_Logo.png',`,
        `    logoSrc: '/assets/chickadee-logo.png',`,
        'brand-config: logoSrc',
      );
      return c;
    },
  },
  {
    src: `${MA}/index.html`,
    dest: 'auth/data/auth/mobile-auth/index.html',
    comment: 'html',
    transform(c) {
      // Drop the eruda mobile-debug console.
      c = hardReplace(
        c,
        `  <!-- Eruda - Mobile Console for Debugging (REMOVE IN PRODUCTION) -->\n` +
          `  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>\n` +
          `  <script>eruda.init();</script>\n`,
        `  <!-- [vendored] eruda debug console removed for production -->\n`,
        'index: drop eruda',
      );
      // Absolute asset paths → this site's layout.
      c = softReplaceAll(c, '/js/data/auth/mobile-auth/', '/auth/data/auth/mobile-auth/');
      c = softReplaceAll(c, '/artwork/Dashie_Full_Logo_Orange_Transparent.png', '/assets/chickadee-logo.png');
      return c;
    },
  },
  {
    src: `${MA}/callback.html`,
    dest: 'auth/data/auth/mobile-auth/callback.html',
    comment: 'html',
    transform(c) {
      // Logo (applyBrandChrome swaps it, but avoid a 404 flash).
      c = softReplaceAll(c, '/artwork/Dashie_Full_Logo_Orange_Transparent.png', '/assets/chickadee-logo.png');
      return c;
    },
  },
  {
    src: `${MA}/phone-auth-handler.js`,
    dest: 'auth/data/auth/mobile-auth/phone-auth-handler.js',
    comment: 'js',
    transform: (c) => c, // verbatim — relative imports resolve under /auth/
  },
  {
    src: `${MA}/styles.css`,
    dest: 'auth/data/auth/mobile-auth/styles.css',
    comment: 'css',
    transform: (c) => c, // verbatim
  },
];

// ---- run -------------------------------------------------------------------

let count = 0;
for (const f of FILES) {
  const srcPath = resolve(SRC_ROOT, f.src);
  let content;
  try {
    content = readFileSync(srcPath, 'utf8');
  } catch (e) {
    throw new Error(`[sync-auth] cannot read source ${srcPath} — is DASHIE_STAGING pointed at a dashieapp_staging checkout?`);
  }
  content = f.transform(content);
  if (f.comment === 'html') {
    // Header goes right after the doctype so nothing precedes <!DOCTYPE>.
    const hdr = header(f.src, 'html');
    content = content.replace(/(<!DOCTYPE html>\n?)/i, `$1${hdr}`);
  } else {
    content = header(f.src, 'line') + content;
  }

  const destPath = resolve(REPO_ROOT, f.dest);
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, content);
  console.log(`  vendored ${f.src}  →  ${f.dest}`);
  count++;
}
console.log(`[sync-auth] done — ${count} files vendored from ${relative(process.cwd(), SRC_ROOT) || SRC_ROOT}`);
