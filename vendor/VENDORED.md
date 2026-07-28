# Vendored auth pages

The device-flow auth pages under [`auth/`](../auth/) are **generated**, not
hand-written. They are vendored from Dashie's source of truth in
`dashieapp_staging` (`js/data/auth/mobile-auth/` + `js/data/auth/auth-config.js`)
by [`sync-auth.mjs`](sync-auth.mjs).

**Do not edit files under `auth/data/` by hand** — edit the upstream source and
re-run the script:

```bash
node vendor/sync-auth.mjs            # source: ../../dashieapp_staging
DASHIE_STAGING=/path node vendor/sync-auth.mjs
```

## Why vendored instead of forked

These pages implement the **hybrid device-flow / OAuth contract** shared with
Dashie (the add-on mints a device code → the phone approval page →
`exchange_code` at the `jwt-auth` edge function → credential mint). A hand-fork
would silently drift from that contract. The script keeps the copy explicit,
re-runnable, and **drift-detecting**: every transform is anchored, and an anchor
miss throws instead of shipping stale auth code. See the row in
`dashieapp_staging/.reference/JS_KOTLIN_CONTRACTS.md`.

## What the script changes (everything else is byte-identical)

| File | Transform |
|---|---|
| `auth-config.js` | hostname env-sniff → `?env=staging\|prod` resolver, persisted in `sessionStorage` across the OAuth round-trip (single origin can't sniff env by host). Default: **production**. |
| `brand-config.js` | default brand `dashie` → `chickadee` (no `?brand=` on this origin); Chickadee `logoSrc` → `/assets/chickadee-logo.png` |
| `index.html` | remove `eruda` debug console; rewrite `/js/data/auth/mobile-auth/` + Dashie logo paths |
| `callback.html` | rewrite Dashie logo path (avoids a 404 flash before `applyBrandChrome` swaps it) |
| `phone-auth-handler.js`, `styles.css` | verbatim |

`auth/utils/logger.js` is a **site-owned shim** (not vendored) — the real Dashie
logger is ~700 lines; the shim matches the `createLogger()` surface the auth
code uses.

## Routing / how a request flows

- `/auth?code=…&env=…` → `auth.html` (root shim) → `/auth/data/auth/mobile-auth/index.html`
- Google redirect URI **`https://getchickadee.org/oauth-callback.html`** →
  `oauth-callback.html` (root shim) → `/auth/data/auth/mobile-auth/callback.html`

The root shims redirect (not rewrite) so the deep document URL keeps the pages'
relative module imports (`../auth-config.js`) resolving correctly.

## Environment

`?env=staging` → staging Supabase (`cwglbt`); `?env=prod` (or absent) →
production (`cseayw`). The add-on's `verificationBase` supplies `env` per
channel (beta → staging, stable → prod).
