// GENERATED — vendored from dashieapp_staging by vendor/sync-auth.mjs.
// Do NOT edit here; edit the source and re-run `node vendor/sync-auth.mjs`.
// Source: js/data/auth/auth-config.js

// js/auth/auth-config.js - Simple Auth Configuration (Keep existing + add logging config)
// CHANGE SUMMARY: Keep existing client_secret, add logging configuration for new logging system

/**
 * Supabase Configuration - Environment-based
 * NOTE: Supabase anon key is SAFE to expose in client code - it's public by design
 * Only the service role key must be kept secret (server-side only)
 */

// ==========================================
// TEMPORARY: Force dev database for testing
// Set to true to use dev database on prod site
// Set to false to use normal auto-detection
// ==========================================
const FORCE_DEV_DATABASE = false;  // Production DB is now active!
// ==========================================

const SUPABASE_ENVIRONMENTS = {
  production: {
    url: 'https://cseaywxcvnxcsypaqaid.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZWF5d3hjdm54Y3N5cGFxYWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDIxOTEsImV4cCI6MjA3MzE3ODE5MX0.Wnd7XELrtPIDKeTcHVw7dl3awn3BlI0z9ADKPgSfHhA',
    edgeFunctionUrl: 'https://cseaywxcvnxcsypaqaid.supabase.co/functions/v1/jwt-auth',
    googleWebClientId: '221142210647-58t8hr48rk7nlgl56j969himso1qjjoo.apps.googleusercontent.com',
    googleDeviceClientId: '221142210647-m9vf7t0qgm6nlc6gggfsqefmjrak1mo9.apps.googleusercontent.com',
    microsoftWebClientId: 'f73fbddc-be9a-4dac-931a-80e18c768993',
    microsoftDeviceClientId: 'f73fbddc-be9a-4dac-931a-80e18c768993',
    environment: 'production'
  },
  development: {
    url: 'https://cwglbtosingboqepsmjk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3Z2xidG9zaW5nYm9xZXBzbWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDY4NjYsImV4cCI6MjA3MzIyMjg2Nn0.VCP5DSfAwwZMjtPl33bhsixSiu_lHsM6n42FMJRP3YA',
    edgeFunctionUrl: 'https://cwglbtosingboqepsmjk.supabase.co/functions/v1/jwt-auth',
    googleWebClientId: '221142210647-58t8hr48rk7nlgl56j969himso1qjjoo.apps.googleusercontent.com',
    googleDeviceClientId: '221142210647-m9vf7t0qgm6nlc6gggfsqefmjrak1mo9.apps.googleusercontent.com',
    microsoftWebClientId: 'f73fbddc-be9a-4dac-931a-80e18c768993',
    microsoftDeviceClientId: 'f73fbddc-be9a-4dac-931a-80e18c768993',
    environment: 'development'
  }
};

/**
 * Ask the NATIVE app which Supabase project this APK targets (from its build flavor).
 *
 * ⚠️ Why this outranks the hostname sniff below.
 *
 * The hostname heuristic works for a browser: the page's domain tells you the environment.
 * It is **wrong for a kiosk**, and dangerously so. A kiosk's page is served by the user's own
 * Home Assistant box — `http://192.168.1.50:8123/...` or the virtual
 * `dashie-kiosk-overlay.local:8099` — and NEITHER matches `dev.` / `local.` / `localhost`.
 * The heuristic's fallthrough is `production`, so a **staging or local-flavor APK's kiosk would
 * read and write the PRODUCTION database.** Hostname simply isn't a valid signal for a page
 * hosted by the user's hardware.
 *
 * The build flavor is the truth, and only native knows it (BuildConfig.SUPABASE_URL).
 *
 * Feature-detected: absent on browsers and on old APKs, which then fall back to the hostname
 * behavior they've always had — so this is additive and compat-safe in both deploy orders.
 * (Kiosk Real Login, Phase 2.)
 */
function getNativeSupabaseConfig() {
  try {
    if (typeof window.DashieNative?.getSupabaseConfig !== 'function') return null;
    const raw = window.DashieNative.getSupabaseConfig();
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg?.url || !cfg?.anonKey) return null;

    // Match the shape of the SUPABASE_ENVIRONMENTS entries by starting from whichever one the
    // native URL names, so callers keep getting edgeFunctionUrl / client ids / environment.
    // (Those extras are per-project, not per-flavor, so deriving them from the URL is correct.)
    const match = Object.values(SUPABASE_ENVIRONMENTS).find(e => e.url === cfg.url);
    if (match) return match;

    // The APK names a project this JS doesn't know (new project, or a JS build older than the
    // APK). Trust the APK — it is the one that knows what it was built against — and synthesize
    // a minimal config rather than silently defaulting to production.
    console.warn(`⚠️ Native names an unknown Supabase project (${cfg.url}); using it verbatim`);
    return {
      url: cfg.url,
      anonKey: cfg.anonKey,
      edgeFunctionUrl: `${cfg.url}/functions/v1/jwt-auth`,
      environment: cfg.flavor || 'native',
    };
  } catch (e) {
    return null;
  }
}

// [VENDORED — getchickadee.org] URL-param environment resolver. Replaces the
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
      else console.warn(`DROP: getchickadee auth ?env='${q}' unrecognized; using production`);
      if (env) { try { sessionStorage.setItem(CHICKADEE_ENV_KEY, env); } catch (_) {} }
    }
    if (!env) env = sessionStorage.getItem(CHICKADEE_ENV_KEY) || 'production';
  } catch (_) { env = 'production'; }
  return SUPABASE_ENVIRONMENTS[env] || SUPABASE_ENVIRONMENTS.production;
}

// Auto-detect environment based on domain
function getCurrentSupabaseConfig() {
  // TEMPORARY: Check override flag first
  if (FORCE_DEV_DATABASE) {
    console.warn('⚠️ OVERRIDE: Using DEV database (FORCE_DEV_DATABASE=true)');
    return SUPABASE_ENVIRONMENTS.development;
  }

  // The APK's build flavor beats any hostname guess — see getNativeSupabaseConfig(). This is
  // what stops a staging kiosk (served from the HA box's IP) from talking to PRODUCTION.
  const native = getNativeSupabaseConfig();
  if (native) return native;

  // [VENDORED — getchickadee.org] Single origin: env from ?env= (see above).
  return resolveChickadeeEnvConfig();
}

export const SUPABASE_CONFIG = getCurrentSupabaseConfig();

/**
 * Authentication Configuration
 * Keep this simple - just the essentials we need
 *
 * NOTE: Client secrets have been removed from client code!
 * They are now stored as environment variables in the edge function where they belong.
 * Client IDs are safe to expose (public by design), but secrets must stay server-side.
 */
export const AUTH_CONFIG = {
  // No secrets here - they belong in edge function environment variables
};

export const API_CONFIG = {
  google: {
    // Base URL for all Google APIs
    baseUrl: 'https://www.googleapis.com',

    // OAuth scopes — default set used for PRIMARY sign-in (covers all Dashie
    // features: calendar, photos via Drive).
    //
    // - calendar.readonly: read calendars + events
    // - calendar.events:   create/edit/delete events (narrower than full `calendar`)
    // - drive.file:        upload to app-created folders (e.g. "Dashie Photos")
    //
    // Per-action flows (e.g. adding a secondary calendar account) can request
    // a narrower subset via `scopeSets` below to avoid triggering Workspace
    // admin policies that block broader scopes.
    scopes: 'profile email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file',

    // Action-specific scope subsets. Passed via signIn({ scopes }) to override
    // the default above. Format matches `scopes` (space-separated string).
    scopeSets: {
      // "Add Calendar Account" in Settings — don't ask for Drive when the user
      // just wants another calendar source. Corporate (Workspace) admins
      // routinely block full-Drive scopes, which would otherwise block the
      // calendar-add flow for those users.
      calendarOnly: 'profile email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
    },

    // Rate limiting (minimum interval between requests in ms)
    rateLimitInterval: 100, // 100ms between requests

    // Retry configuration for failed requests
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,  // 1 second between retries
      maxDelay: 10000   // 10 seconds max backoff
    },

    // Calendar-specific settings
    calendar: {
      monthsAhead: 3, // originally MONTHS_AHEAD_TO_PULL
      monthsBack: 1,  // originally MONTHS_BACK_TO_PULL
      maxResults: 250, // adjust as needed for your API calls
      includeCalendars: [
      ]
    },
  },

  microsoft: {
    // Base URL for Microsoft Graph API
    baseUrl: 'https://graph.microsoft.com/v1.0',

    // OAuth endpoints
    authority: 'https://login.microsoftonline.com/common',
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    deviceCodeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/devicecode',

    // OAuth scopes for calendar access + SSO.
    // - Calendars.ReadWrite:       read/write the user's OWN calendars.
    //   Required separately from .Shared for personal MSA accounts, where
    //   .Shared only grants access to calendars others shared with the user
    //   (doesn't imply write to the user's own calendar).
    // - Calendars.ReadWrite.Shared: read/write on calendars shared with the
    //   user.
    // Both declared in the Azure Portal app registration so personal
    // Microsoft accounts can self-consent without admin approval.
    scopes: 'Calendars.ReadWrite Calendars.ReadWrite.Shared User.Read email profile openid offline_access',

    // Rate limiting (minimum interval between requests in ms)
    rateLimitInterval: 100, // 100ms between requests

    // Retry configuration for failed requests
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,  // 1 second between retries
      maxDelay: 10000   // 10 seconds max backoff
    },

    // Calendar-specific settings
    calendar: {
      monthsAhead: 3,
      monthsBack: 1,
      maxResults: 250
    }
  }
};


/**
 * Logging Configuration for new logging system
 */
export const LOGGING_CONFIG = {
  // Environment detection
  get environment() {
    const hostname = window.location.hostname;
    if (hostname === 'dashieapp.com') return 'production';
    if (hostname === 'dev.dashieapp.com') return 'development';
    return 'development';
  },

  // Log level based on environment
  get level() {
    return this.environment === 'development' ? 'debug' : 'info';
  },
  
  // Category toggles - more verbose in development
  get enableApiLogging() {
    return this.environment === 'development';
  },
  
  enableAuthLogging: true,
  
  get enableDataLogging() {
    return this.environment === 'development';
  },
  
  get enableWidgetLogging() {
    return this.environment === 'development';
  },
  
  // Format options
  enableTimestamps: true,
  enableModuleNames: true,
  enableColors: true
};

// Default export for backward compatibility
export default AUTH_CONFIG;
