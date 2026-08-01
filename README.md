# getchickadee.org

The public site for **Chickadee** — a Home Assistant dashboard and voice
assistant for a wall tablet. Free, no account, runs on the user's own hardware.

Static HTML. No framework, no build step, no JavaScript, no webfonts, no
analytics, no third-party requests of any kind. Deployed on Vercel.

> **The no-third-party-requests rule is a product claim, not a preference.**
> The site tells people Chickadee doesn't phone home; a page that loaded a CDN
> font while saying so would be the first thing a sceptical reader caught. If
> you are about to add a script tag pointing at another host, don't.

## The positioning, in one line

**Bring your AI key — optionally one more for web search — and everything else
runs on the box you already have.** Setup friction is owned, not apologised for:
every account is the user's own, nothing is metered through us. Two standing
rules for anyone editing copy:

- **Never mention a hosted service.** One does not exist. If one is ever built,
  it does not appear here without an explicit decision.
- **Never hard-code the number of engine options.** Write "one of the
  following", not "three ways" — the list has already grown once.

## 🚦 The site is not live yet

`vercel.json` currently carries a **blanket 307** sending every path to
`dashieapp.com`. It dates from the 2026-07-30 brand retirement and is being kept
deliberately: it lets the relaunch be built and committed in the open without
anything reaching production before the rest of the work is ready.

**Everything in this repo is therefore currently unreachable.** Removing that
redirect is the go-live action, and it needs John's explicit approval.

## Structure

Structure is ported from dashieapp.com's `index.html` + `voice-ai.html`, with
every payment implication removed — see the port commit for the item-by-item
list of what changed and why.

| Path | Page |
|---|---|
| `index.html` | Home — hero, carousel, platforms, what's included, what it doesn't do |
| `voice.html` | `/voice` — Voice & AI, the BYOK key table, privacy tiers, optional upgrades |
| `about.html` | `/about` — provenance: who builds it, what's published, the Dashie relationship |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `404.html` | Served by Vercel for unknown paths |
| `assets/site.css` | The only stylesheet — every page uses it |
| `assets/` | Wordmark (900×300), favicon (256×256), `og.png` (1200×630) |
| `robots.txt`, `sitemap.xml` | Four URLs; update `lastmod` when a page changes materially |

Wordmark and favicon match `dashieapp_staging/.reference/brand-assets/chickadee/`
byte-for-byte; don't regenerate them.

`assets/og.png` is the social preview card — what renders when someone posts the
link to Reddit or a forum. It was composed by rendering a 1200×630 HTML page in
headless Chrome rather than by hand, so it can be regenerated when the headline
changes; the source is not kept in the repo because it is nine lines of CSS
around the wordmark. If you change the landing page's `h1`, change this too or
the card will quote copy the site no longer uses.

## Product shots — the one thing the site is missing

Every product image is a `.shot` placeholder that states what belongs there.
**The Dashie screenshots are deliberately not reused**: they carry the orange
Dashie mark and "Hey Dashie" as the wake word, and Dashie-branded UI on a
Chickadee site reads as a rebadge — which costs more trust than any disclosure
buys back.

Needed, in priority order (voice leads the page now):

| # | Shot | Where |
|---|---|---|
| 1 | Answering a spoken question, result card on screen | `/voice` hero — the money shot |
| 2 | Dashboard full screen on a wall tablet | home carousel 1 |
| 3 | Photo screensaver, idle | home carousel 2 |
| 4 | Voice answer over a dashboard | home carousel 3 |
| 5 | Live camera feed | home carousel 4 |
| 6 | Music Assistant speaker selector | home carousel 5 |

Drop each in `assets/` and replace the `<div class="shot"><span>…</span></div>`
with `<div class="shot"><img src="/assets/…" alt="…"></div>`. The slot keeps its
16:10 box either way, so nothing reflows.

## Copy changes waiting on someone else to ship

Not gates — just things to fold in **when the capability actually exists**, never before.
The rule the whole site runs on: a claim goes up when it is true, not when it is planned.

- **Optional API-Sports key.** Sports runs keyless on ESPN and always will by
  default; Thread B is adding an API-Sports adapter as an optional fallback
  upgrade for broader coverage. When it ships, it becomes one more `Optional`
  row in the `/voice` key table (the table's shape already takes it) and a line
  in the "optional upgrades" section. **No urgency, and do not add it early** —
  the table's whole job is being an accurate count of what a user must go and
  get.

## Go-live checklist

Work through this **before** removing the redirect. Several items are claims the
site makes that were true when written and must be re-checked, because this
brand has reversed direction three times in eight days.

- [x] ~~**Thread B has created the Chickadee repositories.**~~ Done 2026-08-01:
      `chickadee`, `chickadee-integration`, `chickadee-voice-integration` all
      exist and resolve.
- [x] ~~**Render the withheld links.**~~ Done — source, issues, and both
      integration repos are linked and verified 200.
- [ ] 🔴 **`jwlerch78/chickadee` is a README-only placeholder.** The add-on
      channels are not in it yet, so **the one-click "Add to Home Assistant"
      button and the pasted-repository-URL line are deliberately held back** —
      both would fail in HA today. `grep -rn SOURCE_URL .` finds them. Restore
      when Thread B lands the add-on channels, and click the button once to
      confirm HA actually finds the add-on.
- [ ] **Link `LICENSE` and `PROVENANCE.md` on `/about` and `/terms`.** Both are
      named as plain text because they 404 in the placeholder repo.
- [ ] **Re-verify the "what's published" list in `/about`.** It says the Android
      source mirror is not published. If Phase 3 has landed, update that bullet
      *and* add the STT model-weights caveat staged in the HTML comment beside
      it — a fresh clone builds, but on-device speech-to-text self-disables
      until `scripts/fetch-stt-models.sh` fetches ~260 MB of pinned weights.
- [ ] **Re-verify the CDN disclosure in `/privacy`.** It names `hls.js` and
      `heic2any` loading from jsDelivr in the console. True as of 2026-08-01
      (`dashie-ha/frontend/console/index.html`). If the hardening pass removed
      them, the disclosure should shrink rather than silently overstate.
- [ ] **Re-verify the install steps** on the landing page against the add-on's
      actual README — panel name, restart prompt, and the repository URL.
- [ ] 🔴 **Re-check every provider free-tier claim.** `/voice` quotes specific,
      perishable numbers: Tavily 1,000 searches/month with no card, Deepgram
      $200 signup credit with no card, ElevenLabs free-tier API at 10,000
      chars/month, Inworld ~40 min/month. **These expire without warning** —
      Brave killed its free Search API tier in February 2026 and now requires an
      uncapped card, which is exactly why it appears nowhere here. A quoted free
      tier that has quietly become card-required is the single most damaging
      thing this site could get wrong with an r/HA audience. Source of truth:
      `dashieapp_staging/.reference/build-plans/20260801_BYOK_TOOLS_FEASIBILITY.md`.
- [x] ~~**Confirm the ESPN decision has been made.**~~ **Decided 2026-08-01:
      direct + disclosed.** Chickadee calls ESPN's public endpoints directly and
      says so plainly — no proxy, no concealment — precedent-verified against
      years of open ESPN-endpoint use elsewhere in the HA ecosystem
      (`ha-teamtracker` and others). The `/voice` "sports needs no key" row and
      the `/privacy` disclosure are **correct as written**; no copy change was
      required.
- [ ] **Fix the GitHub repo description.** It still reads *"Retired. The
      Chickadee brand was consolidated into Dashie on 2026-07-30."* Live and
      indexed right now; `vercel.json` does not mask it.
- [ ] **Confirm `hello@getchickadee.org` still delivers.** ImprovMX MX records
      are in place; send one test mail. An unmonitored contact address on a
      privacy page is worse than none.
- [ ] **Then** remove the redirect (below) and confirm the apex serves the
      landing page.

### The go-live change

Replace the `redirects` array in `vercel.json` with an empty one, or drop the
key. Keep `cleanUrls` and `trailingSlash`. That is the entire deploy.

## Deploy

Push to `main` → Vercel builds automatically. Static files, no build step.

**A commit can reach production**, so treat pushing as deploying and confirm
with John first. The repo is public: explicit-path commits
(`git commit -m "…" -- <files>`), and no AI/Claude co-author trailers.

## History

Some of this repo's history describes an earlier design in which Chickadee had
an account, Google sign-in, and metered credits. That is gone — there is no
account and no service — and the pages were rewritten on 2026-08-01. The old
commits are left in place rather than rewritten; the project's disclosure
posture does not survive selectively tidying its own record.
