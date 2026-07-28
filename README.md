# getchickadee.org

The public site for [Chickadee](https://github.com/jwlerch78/chickadee) — voice
& AI for Home Assistant. Static, no framework, no analytics. Deployed on Vercel.

## Structure

- `index.html` — landing page
- `assets/` — wordmark + favicon
- `privacy.html`, `terms.html` — legal pages (pending review)
- `credits/return.html` — Stripe checkout return (Phase 3)
- Auth/confirmation screens are vendored from the Dashie app repo (device-flow
  OAuth contract is shared — not forked). See the build plan.

## Deploy

Push to `main` → Vercel builds automatically. No build step; it's static files.
