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

## The two integrations — get this right before writing any install copy

Recorded 2026-08-03 after T reported the add-on and the site telling different
onboarding stories. **They were not actually in conflict, and the reason matters
more than the fix**: the two surfaces are talking about *two different
integrations*, and both HACS entries carry the product name.

| HACS entry | What it is | Does the user install it? |
|---|---|---|
| **Chickadee Voice** | the voice/Assist integration | ❌ **No** — the add-on installs and updates it. Installing it from HACS is *supported* but means you have taken over keeping it in step with the add-on |
| **Chickadee** | the device integration (an Android tablet or Fire TV appearing in HA) | ✅ **Yes, from HACS** — and only if you run the app on a screen |

So the console's empty state saying *"install it from HACS"* (the device
integration) and the add-on README saying *"you do not add that one separately"*
(the voice integration) are **both correct**. Reading either as a statement about
"the integration" is what makes them look contradictory.

⚠️ The trap for a future edit: "the add-on installs the integration for you" is
true but **incomplete**, and a reader who generalises it is then surprised by the
console telling them to install from HACS. `/voice` now names both entries
explicitly. If you shorten that passage, you reintroduce the gap.

📌 And per the console source, `BRAND.productName` resolves the device
integration's HACS name in both editions — **if that entry is ever renamed away
from the product name, the console string and this site both start lying.**

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

**Reconciled against reality 2026-08-03.** Five items were already done and
still showed unchecked, which is the failure this file exists to prevent — an
unchecked box reads as work remaining, and a checklist that cries wolf gets
skimmed at exactly the moment it matters. Each is now closed **with the evidence
and the SHA**, not just ticked. Two of the closures found real defects on the
way (`/about` pointed at a `PROVENANCE.md` that 404s where it said it was;
the install steps omitted the restart and the channel choice), and one — the
go-live change itself — was actively wrong; see the correction below.

**Where the gates stand:** T's board has Chickadee beta **C1–C7 all ✅**
(session 26s), so the technical gate the full-site flip was staged behind has
fired. **`hello@` is confirmed working** (John, 2026-08-03 — he had tested it
previously), so the contact lines are un-held and **every checklist item is now
either done or John's judgement call.** What remains for the flip is **his
word** — it has always been his call, and nothing here changes that.

- [x] ~~**Thread B has created the Chickadee repositories.**~~ Done 2026-08-01:
      `chickadee`, `chickadee-integration`, `chickadee-voice-integration` all
      exist and resolve.
- [x] ~~**Render the withheld links.**~~ Done — source, issues, and both
      integration repos are linked and verified 200.
- [x] ~~**`jwlerch78/chickadee` is a README-only placeholder.**~~ Re-checked
      2026-08-03: it is a real add-on repository — `repository.yaml` plus both
      channel directories (`chickadee`, `chickadee_dev`) and a `LICENSE`. The
      CTA is **already restored** in `home.html` and `voice.html`; the
      `.pending` box is gone.

      🔍 **Why a tester finds nothing to click (T, 2026-08-03 — not a defect).**
      T checked `/`, `/install`, `/docs`, `/setup` and found no
      `my.home-assistant.io` link anywhere. Correct, and fully explained: **the
      only two pages carrying the CTA are `voice.html`, which is masked, and
      `home.html`, which is parked.** The live holding page has never had an
      install CTA — deliberately. So **there is nothing to click until John
      unmasks `/voice`**, and that is a visibility change, therefore his call.
      ⬜ The sub-item stays open: once `/voice` is live, click the button once
      and confirm HA actually finds the add-on. Everything else here was
      verified over HTTP; that one cannot be.
- [x] ~~**Link `LICENSE` and `PROVENANCE.md` on `/about` and `/terms`.**~~ Done
      2026-08-03 (`97e699f`). The premise had gone stale in both directions:
      `LICENSE` now serves 200 in all three repos and `/terms` already linked
      it, while `PROVENANCE.md` **404s in every Chickadee repo** — it lives at
      [`jwlerch78/dashie-ha`](https://github.com/jwlerch78/dashie-ha/blob/main/PROVENANCE.md),
      which is where all three repo READMEs point. `/about` said "the
      `PROVENANCE.md` file in the repository", so the disclosure page was the
      one surface sending readers somewhere the file is not. Now linked to the
      real location. **Deliberately not linking `LICENSE` on `/about`**: it
      links each repo, and `/terms` is the page whose job that is.
- [ ] 🔒 **`/about` must keep the full Dashie disclosure.** The holding page
      deliberately does not carry it (John, session 9) and the source repos do —
      so `/about` is where the complete relationship statement lives. It is
      currently at `about.html`, under "Who builds it". **Do not remove it when
      the full site ships**; a site with no disclosure anywhere is the failure
      this project is designed against.
- [x] ~~**Re-verify the "what's published" list in `/about`.**~~ Re-checked
      against GitHub 2026-08-03 (`51a84fa`): `chickadee-android` genuinely does
      not exist, so the "not published yet" bullet is correct, and the page's
      "accurate as of" stamp was moved to the date it was actually checked.
      **Re-check again at publish** — this bullet goes stale the day the mirror
      lands, and it is the one claim on the page that flips without anyone
      touching the site.
- [x] ~~**Re-verify the CDN disclosure in `/privacy`.**~~ Re-checked 2026-08-02:
      Thread B removed `hls.js` (deleted, not relocated — it had no consumer in
      any tree). `heic2any` is still there, so the disclosure now names one
      library, not two. **Re-check again at publish** — it shrinks to nothing
      once heic2any moves to the family delta.
- [x] ~~**Set the effective date to the publish date.**~~ Done at go-live
      (`a9dda31`): both legal pages read **August 2, 2026**, the day they became
      reachable. `about.html`'s "accurate as of" was deliberately left separate —
      it is a snapshot claim, not an effective date, and it moves whenever the
      claim is re-checked.
- [x] ~~**Re-verify the install steps** against the add-on's actual README.~~
      Done 2026-08-03 (`de1dffd`). The repository URL and the
      Settings → Add-ons → Add-on Store → ⋮ → Repositories path both matched.
      Three things the README tells a user that the site did not: **restart HA
      when it asks**, **install `Chickadee` and not `Chickadee (Dev)`** (the
      store shows both), and **the add-on installs the voice integration for
      you**. The third matters more than it reads — a hand-added integration is
      not add-on-managed, and per T's s26r finding the installer then skips it
      forever behind a log line that looks like a deliberate choice. No panel
      name is claimed anywhere on the site, so there was nothing to contradict.
- [x] ~~**Re-check every provider free-tier claim.**~~ 🚫 **RETIRED as a
      recurring item 2026-08-03 (`42cc863`) — do not reinstate it.** The site no
      longer quotes a single provider figure. Every one was a standing promise
      to watch someone else's pricing page, and two had already broken: Inworld
      moved ~40 → 70 minutes with nothing to signal it, and Brave killed its
      free Search API tier outright in February 2026.

      Each figure was replaced by a **link to the provider's own pricing page**,
      which is always current by construction. What stays is the *shape*,
      because that is what the argument actually rests on — "Optional — free
      tier, no card" still makes the second key credible, and "free tiers,
      enough to hear the difference, not enough to run on" still sets the
      expectation. Neither needs a number.

      🔒 **The standing rule that replaces this checkbox:** do not reintroduce a
      provider figure. If a sentence seems to need one, it is leaning on
      something we cannot keep true. 🎁 This also mooted the long-open
      "is ElevenLabs' free tier API-accessible?" question — the page no longer
      characterises their tier beyond "a free tier exists", so there is nothing
      left to verify.
- [x] ~~**Confirm the ESPN decision has been made.**~~ **Decided 2026-08-01:
      direct + disclosed.** Chickadee calls ESPN's public endpoints directly and
      says so plainly — no proxy, no concealment — precedent-verified against
      years of open ESPN-endpoint use elsewhere in the HA ecosystem
      (`ha-teamtracker` and others). The `/voice` "sports needs no key" row and
      the `/privacy` disclosure are **correct as written**; no copy change was
      required.
- [x] ~~**Fix the GitHub repo description.**~~ Fixed. Verified over the API
      2026-08-03 — the "Retired… consolidated into Dashie" text is gone. It now
      reads *"Chickadee — a free alternative to Fully Kiosk for Home Assistant
      dashboards on Android tablets…"*, which is John's own framing and a third
      wording; it is not the one this file previously recorded, so **read it
      from GitHub rather than from here** if it matters to a copy decision.
- [x] ~~**Confirm `hello@getchickadee.org` still delivers.**~~ **Confirmed
      working 2026-08-03** — John had tested it previously. DNS was verified
      independently (MX → `mx1`/`mx2.improvmx.com`, SPF
      `include:spf.improvmx.com`); what could not be seen from outside was
      whether the alias itself existed, and it does.

      **Contact lines un-held the same day** across `index.html` (the live
      page), `404.html`, `about.html`, `voice.html`, `privacy.html` and
      `terms.html`. Email sits *alongside* the issue links rather than replacing
      them — public issues stay the right default for technical questions.
      ⚠️ On `/privacy` it is more than a convenience: a privacy page whose only
      contact is a public tracker forces a data request to be made in public and
      requires a GitHub account, so that page says explicitly that email reaches
      a person and needs no account.

      🅿️ **`home.html` was deliberately NOT un-held** — it is parked and
      superseded, and editing it would imply it ships. If it is ever promoted,
      restoring its contact line is part of that proposal, not a leftover.
- [ ] **Then** make the go-live change (below) and confirm the apex serves the
      landing page and that `/voice` + `/about` serve their own content.

### The go-live change

⚠️ **Corrected 2026-08-03. This section used to say "replace the `redirects`
array with an empty one, or drop the key." Do not do that** — it was written
when the array held only the mask, and the array has grown since. Dropping it
does three things and only one of them is intended.

The array now holds **five** rules. Exactly one is the mask:

```json
{ "source": "/:path((?!assets/|privacy|terms|screensaver|robots|sitemap).+)",
  "destination": "/", "permanent": false }
```

**Delete that one rule and nothing else.** The other four are the legacy
`/privacy-policy[.html]` and `/terms-of-service[.html]` catchers — Dashie's URL
shape, which someone arriving with that habit will still try. They are not part
of the mask and must survive go-live. (The app itself is safe either way:
`kiosk-overlay/js/brand.js` points at the clean `/privacy` and `/terms`.)

🔴 **And deleting the mask alone is still not enough — it unmasks `/home` too.**
`home.html` is superseded (see the warning at the top of this file): it is the
earlier port, carrying an unreviewed `h1` and the carousel, and it is **parked,
not shipping**. With the mask gone it would serve at `/home`. The sitemap does
not list it, so this would not be indexed — it would just be quietly reachable,
which is how an unreviewed page gets found by exactly the audience that reads
view-source.

So the go-live change is:

1. Delete the catch-all mask rule; keep the other four.
2. Add `{ "source": "/home", "destination": "/", "permanent": false }`, **or**
   delete `home.html` outright. Prefer the redirect until John has ruled on the
   carousel proposal — deleting the file forecloses it.
3. Keep `cleanUrls` and `trailingSlash`.
4. Verify after deploy: `/voice` and `/about` serve their own content (200, not
   a redirect to `/`), `/home` does **not**, and `/privacy-policy.html` still
   lands on `/privacy`.

📌 The general lesson, and the reason this is spelled out: **a procedure that
describes config by its shape ("the array") rots when the config grows.** Name
the rule, not the container.

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

---

## 📸 v2 screenshot triage (2026-08-04) — what can ship and what cannot

The ported pages carry **31 images**. They split into two classes, and the split is what matters:

**Class 1 — photos and non-app captures. Fine as-is.** Hardware shots (`guide-onn-stick`,
`guide-onn-otg`, `guide-onn-webcam`, `guide-echo-show-5-hero`), the photo screensaver captures,
the Unsplash example, store badges and icons. Nothing in the pixels names a brand.

**Class 2 — app/UI screenshots. These show whatever brand the app was running.** Renaming the file
does nothing; the brand is *inside* the image. Verified individually:

| image | verdict |
|---|---|
| `chickadee-kiosk-voice-response.png` | ✅ HA logo + a result card, no branding |
| `chickadee-kiosk-screensaver.png` | ✅ photo + clock + weather |
| `chickadee-kiosk-lock-screen.png` | ✅ Lock dialog, orange accent only |
| `chickadee-voice-hero.webp` | ✅ voice conversation, clean |
| `_Chickadee_Sidebar.png` | ✅ icon strip only |
| `_Chickadee_Controlcenter.png` | 🔴 **"Hey Dashie v3.9S, HA Assist"** |
| `Chickadee_Integration_Screenshot_1.png` | 🔴 "Dashie Fire Tablet", "by Dashie", the Dashie mark ×2, "John Lerch" ×3 |
| `Chickadee-kiosk-integration.png` | 🔴 "by Dashie", Dashie mark ×2 |
| `chickadee-battery-management.png` | 🔴 "Hey Dashie", "Dashie Cams", **and an in-image "Start a 30-day free trial" upsell** |
| `chickadee-kiosk-speaker-selector.png` | 🔴 speakers named `… Dashie` ×3, plus a personal account name |
| `video-streaming-hero.png` | 🔴 shows **calendar + family location** — features Chickadee does not have |

📌 **The important pattern: most Class-2 failures are about PRODUCT, not branding.**
`video-streaming-hero` has no "Dashie" text at all and is still unusable, because it advertises a
paid Dashie feature set. A better logo fixes none of these — **they need re-capturing from a
Chickadee build**, which is a device task, not an editing one.

⚠️ **Two also carry personal data** (a real account name, family faces, a home town). Already
public on dashieapp.com, but worth a deliberate yes before appearing on a second site.

**Not yet individually verified:** the remaining `_Chickadee_*` guide captures
(`ConfigureHA`, `MainScreen`, `QuickFunctions`) and the `video-feeds-*` set. Expect the same split
— the HA-side captures are usually clean, the app-side ones usually are not.
