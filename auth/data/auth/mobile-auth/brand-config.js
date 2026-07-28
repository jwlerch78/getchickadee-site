// GENERATED — vendored from dashieapp_staging by vendor/sync-auth.mjs.
// Do NOT edit here; edit the source and re-run `node vendor/sync-auth.mjs`.
// Source: js/data/auth/mobile-auth/brand-config.js

// brand-config.js — brand skin for the device-approval pages (mobile-auth).
//
// The approval + OAuth-callback pages serve BOTH brands of the one account
// system: Dashie (default — behavior unchanged) and Chickadee (the open-core
// voice add-on; its Ingress panel opens the verification URL with
// `&brand=chickadee`). Google's `state` param is a fixed string in this flow
// and the OAuth callback URL carries no brand, so the brand rides
// sessionStorage across the round-trip.
//
// googleWebClientId: per-brand override for a future Chickadee OAuth client
// (consent screen shows the client's app name — today both brands use the
// Dashie client, so Google's consent still says "Dashie" until John creates
// the Chickadee client in Google Cloud). The edge fn needs the matching
// secret before flipping this (GOOGLE_CLIENT_SECRET side of exchange_code).

const BRAND_STORAGE_KEY = 'hybrid_device_brand';

export const BRANDS = {
  dashie: {
    id: 'dashie',
    productName: 'Dashie',
    logoSrc: '/artwork/Dashie_Full_Logo_Orange_Transparent.png',
    logoEmoji: null,
    googleWebClientId: null,     // null → SUPABASE_CONFIG.googleWebClientId
    googleScopes: null,          // null → API_CONFIG.google.scopes (full Dashie set)
    // Post-auth destination (app-download / open-app page). null = terminal:
    // show "close this tab" copy instead of redirecting.
    completeUrl: '/auth-complete',
  },
  chickadee: {
    id: 'chickadee',
    productName: 'Chickadee',
    logoSrc: '/assets/chickadee-logo.png',
    logoEmoji: '🐦',   // fallback if the artwork 404s (applyBrandChrome uses logoSrc first)
    // The Chickadee GCP project's web client — consent says "Chickadee".
    // The matching secret lives in Supabase (GOOGLE_CHICKADEE_CLIENT_SECRET);
    // jwt-auth picks it by this id (oauth_client_id on exchange_code).
    googleWebClientId: '439564757861-t9f9cgo1oddn89buoinov536b0kd012j.apps.googleusercontent.com',
    // Identity only — Chickadee never asks for calendar/drive. A user who
    // later joins Dashie re-consents under the Dashie client at that point.
    googleScopes: 'openid email profile',
    // No Chickadee app to open — the add-on panel polls and completes on its
    // own; the right ending is "return to Home Assistant".
    completeUrl: null,
  },
};

/**
 * Resolve the active brand: ?brand= on the URL wins (and is persisted for the
 * OAuth round-trip); otherwise the persisted value; otherwise Dashie.
 * Unknown brand ids fall back to Dashie — never a broken page.
 */
export function resolveBrand() {
  let id = null;
  try {
    id = new URLSearchParams(window.location.search).get('brand');
    if (id && BRANDS[id]) {
      sessionStorage.setItem(BRAND_STORAGE_KEY, id);
    } else {
      id = sessionStorage.getItem(BRAND_STORAGE_KEY);
    }
  } catch { /* sessionStorage unavailable — default */ }
  return BRANDS[id || 'chickadee'] || BRANDS.chickadee;
}

/** Clear the persisted brand (call when a flow completes). */
export function clearBrand() {
  try { sessionStorage.removeItem(BRAND_STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Apply brand chrome to the current page: tab title, logo image, and any
 * static copy that names the product. No-op for Dashie so the default pages
 * are byte-for-byte unchanged in behavior.
 *
 * @param brand - from resolveBrand()
 * @param textSelectors - CSS selectors whose textContent may name the product
 */
export function applyBrandChrome(brand, textSelectors = []) {
  if (brand.id === 'dashie') return;

  document.title = document.title.replace(/Dashie/g, brand.productName);

  // Swap the logo <img> for an emoji mark when the brand has no image asset.
  for (const img of document.querySelectorAll('img[alt="Dashie"]')) {
    if (brand.logoSrc) {
      img.src = brand.logoSrc;
      img.alt = brand.productName;
    } else if (brand.logoEmoji) {
      const mark = document.createElement('div');
      mark.textContent = brand.logoEmoji;
      mark.setAttribute('aria-label', brand.productName);
      mark.style.cssText = 'font-size:56px;line-height:1;margin-bottom:16px;';
      img.replaceWith(mark);
    }
  }

  for (const sel of textSelectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (el.textContent.includes('Dashie')) {
        el.textContent = el.textContent.replace(/Dashie/g, brand.productName);
      }
    }
  }
}
