# getchickadee.org

The public site for **Chickadee** — a Home Assistant dashboard and voice
assistant for a wall tablet. Free, no account, runs on the user's own hardware.

Static HTML. No framework, no build step, no JavaScript, no webfonts, no
analytics, no third-party requests of any kind. Deployed on Vercel.

> **The no-third-party-requests rule is a product claim, not a preference.**
> The site tells people Chickadee doesn't phone home; a page that loaded a CDN
> font while saying so would be the first thing a sceptical reader caught. If
> you are about to add a script tag pointing at another host, don't.

> **No internal annotations in shipped HTML. Ever.**
> Not `TODO`, not thread names, not "held back until X", and above all not a
> comment explaining why something was *removed*. This shipped once: the live
> holding page carried a comment narrating the removal of the provenance
> sentence, and an external reviewer found it before we did. On a page whose
> whole posture is honesty, an annotated removal reads as an annotated
> cover-up. Anything a future editor needs to know goes in **this README** or
> the thread status file — both are for exactly that. View-source is part of
> the shipped artifact on this site more than most, because this audience
> reads it.

## The positioning, in one line

**Bring your AI key — optionally one more for web search — and everything else
runs on the box you already have.** Setup friction is owned, not apologised for:
every account is the user's own, nothing is metered through us. Two standing
rules for anyone editing copy:

- **Never mention a hosted service.** One does not exist. If one is ever built,
  it does not appear here without an explicit decision.
- **Never hard-code the number of engine options.** Write "one of the
  following", not "three ways" — the list has already grown once.

## 🚦 What `index.html` is

`index.html` is **the approved landing page** — the copy John rewrote and
published. It began as a holding page while the rest of the site was masked, and
the masking is still in force, but its content is not a placeholder: it is what
goes live. `vercel.json` 307s the unapproved pages back to `/`.

### ⚠️ Why it is done by filename and not by a rewrite

The first attempt used `rewrites: [{ "source": "/", "destination": "/holding.html" }]`
while leaving the full site at `index.html`. **It failed in production.**
Vercel's filesystem takes precedence over `rewrites` — because `index.html`
existed, `/` served it and the rewrite never fired, publishing the unapproved
full-site home page. A 17-path local simulation had passed, because it modelled
the redirects correctly and Vercel's rewrite precedence incorrectly.

So the holding page is `index.html` outright. `/` is a plain filesystem hit
with **no routing rule to get wrong**. Don't "tidy" this back into a rewrite.

### 🔴 `index.html` is canonical. `home.html` is superseded — do NOT promote it.

**An earlier version of this file said the opposite** and gave a swap recipe
(`git mv home.html index.html`) that would have replaced John's reviewed copy
with copy he has never read, at the exact moment nobody is reading the diff.
Ruled 2026-08-02: *approved copy wins; fix the README rather than following it.*

- **`index.html` holds the approved hero.** John rewrote it, reviewed it, and
  said publish. Whatever is served at `/`, its content is this.
- **`home.html` is the earlier dashieapp.com port.** Different `h1`, plus a
  carousel and feature grid that were never reviewed. It is **superseded, not
  parked for promotion.**
- If anything in it is worth keeping — the carousel is the only candidate —
  that is a **separate proposal to John after go-live**, never a go-live-day
  change.

### At full go-live

Dropping the `redirects` array is what unmasks `/voice` and `/about`.

> ⚠️ **It also makes `/home` reachable**, serving the unapproved copy above.
> Delete `home.html`, or keep one redirect for it. Do not just drop the array
> and assume the masking of that page came with it.

Work the checklist below first. **When the holding page comes down at all is
John's call** and is gated on Thread T's C5 PASS — this section only says what
goes live when it does.

## 🚦 What is live right now

Live and public: **`/`** (the approved landing page), **`/privacy`**,
**`/terms`**, **`/screensaver`**, `/assets/*`, `robots.txt`, `sitemap.xml`.

Still masked by the catch-all in `vercel.json`, all 307 to `/`: `/voice`,
`/about`, `/home`, `/index.html`, `/404.html`.

## Structure

Structure is ported from dashieapp.com's `index.html` + `voice-ai.html`, with
every payment implication removed — see the port commit for the item-by-item
list of what changed and why.

| Path | Page |
|---|---|
| `index.html` | **`/` — the approved landing page.** Canonical; see the warning above |
| `home.html` | ⚠️ **superseded**, not served, not to be promoted. Earlier dashieapp.com port |
| `voice.html` | `/voice` — Voice & AI, the BYOK key table, privacy tiers, optional upgrades |
| `about.html` | `/about` — provenance: who builds it, what's published, the Dashie relationship |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `404.html` | Served by Vercel for unknown paths |
| `assets/site.css` | The only stylesheet — every page uses it |
| `assets/` | Wordmark (900×300), favicon (256×256), `og.png` (1200×630) |
| `robots.txt`, `sitemap.xml` | Three URLs — only pages that are live AND indexable. `/screensaver` is excluded (noindex) |

`chickadee-logo.png` and `favicon.png` are byte-for-byte copies from
`dashieapp_staging/.reference/brand-assets/chickadee/` — don't regenerate them.
`chickadee-logo-dark.png` is **derived** (neutral ink inverted, brand orange
untouched) because no dark-surface wordmark shipped; the same file is in
brand-assets so Thread A uses one artifact rather than rolling its own.
`og.png` bakes the mark in, so it must be **re-rendered**, not copied, whenever
the mark or the headline changes.

`assets/og.png` is the social preview card — what renders when someone posts
the link to Reddit or a forum. It is composed by rendering a 1200×630 HTML page
in headless Chrome; the source is not kept here because it is nine lines of CSS
around the wordmark.

## Product shots — the one thing the site is missing

Every product image is a `.shot` placeholder that states what belongs there.
**The Dashie screenshots are deliberately not reused**: they carry the orange
Dashie mark and "Hey Dashie" as the wake word, and Dashie-branded UI on a
Chickadee site reads as a rebadge — which costs more trust than any disclosure
buys back.

⚠️ **Re-scoped 2026-08-02.** Five of these six originally targeted `home.html`'s
carousel, and `home.html` is now superseded (see the warning near the top). Only
the first has a slot on a page that ships.

| # | Shot | Where | Still needed? |
|---|---|---|---|
| 1 | Answering a spoken question, result card on screen | `/voice` hero | ✅ **yes** — a real slot on a page that ships |
| 2 | Dashboard full screen on a wall tablet | was home carousel | ⏸ only if the carousel is proposed post-go-live |
| 3 | Photo screensaver, idle | was home carousel | ⏸ same |
| 4 | Voice answer over a dashboard | was home carousel | ⏸ same |
| 5 | Live camera feed | was home carousel | ⏸ same |
| 6 | Music Assistant speaker selector | was home carousel | ⏸ same |

**The live landing page has no image slot at all.** If it should have one, that
is a design change to approved copy and therefore John's call — not something to
add while dropping a screenshot in.

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
      both would fail in HA today. They live in the CTA block at the bottom of
      `home.html` and `voice.html` (the `.pending` box). Restore when Thread B
      lands the add-on channels, and click the button once to confirm HA
      actually finds the add-on.
- [ ] **Link `LICENSE` and `PROVENANCE.md` on `/about` and `/terms`.** Both are
      named as plain text because they 404 in the placeholder repo.
- [ ] 🔒 **`/about` must keep the full Dashie disclosure.** The holding page
      deliberately does not carry it (John, session 9) and the source repos do —
      so `/about` is where the complete relationship statement lives. It is
      currently at `about.html`, under "Who builds it". **Do not remove it when
      the full site ships**; a site with no disclosure anywhere is the failure
      this project is designed against.
- [ ] **Re-verify the "what's published" list in `/about`.** It says the Android
      source mirror is not published. If Phase 3 has landed, update that bullet
      *and* add the STT model-weights caveat: a fresh clone builds, but
      on-device speech-to-text self-disables
      until `scripts/fetch-stt-models.sh` fetches ~260 MB of pinned weights.
- [x] ~~**Re-verify the CDN disclosure in `/privacy`.**~~ Re-checked 2026-08-02:
      Thread B removed `hls.js` (deleted, not relocated — it had no consumer in
      any tree). `heic2any` is still there, so the disclosure now names one
      library, not two. **Re-check again at publish** — it shrinks to nothing
      once heic2any moves to the family delta.
- [ ] **Set the effective date to the publish date.** Both legal pages say
      *August 1, 2026*, which is when they were written, not when they went
      live. They have never been published, so pick the real date at push time
      rather than shipping a date that predates the page being reachable.
- [ ] **Re-verify the install steps** on the landing page against the add-on's
      actual README — panel name, restart prompt, and the repository URL.
- [ ] 🔴 **Re-check every provider free-tier claim.** `/voice` quotes specific,
      perishable numbers. **These expire without warning** — Brave killed its
      free Search API tier in February 2026 and now requires an uncapped card,
      which is why it appears nowhere here. A quoted free tier that has quietly
      become card-required is the single most damaging thing this site could get
      wrong with an r/HA audience.

      **Checked 2026-08-02 against the live pricing pages:**

      | Claim | Result |
      |---|---|
      | Tavily 1,000/month, no card | ✅ "1,000 API credits / month", "No credit card required" |
      | Deepgram $200 signup, no card | ✅ "$200 Credit", "No credit card required" |
      | ElevenLabs ~10,000 chars/month | ✅ number confirmed |
      | Inworld free TTS | ❌ **was wrong** — the page said ~40 min, Inworld says **up to 70 min**. Fixed. |

      ⚠️ **ElevenLabs free-tier API access is still unverified.** The
      feasibility doc flagged it as unconfirmed; the pricing page does not say
      either way. The copy no longer asserts it — do not put it back without a
      source, because a user who signs up and finds the API gated has been
      actively misled.
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
