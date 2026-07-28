// GENERATED — vendored from dashieapp_staging by vendor/sync-auth.mjs.
// Do NOT edit here; edit the source and re-run `node vendor/sync-auth.mjs`.
// Source: js/data/auth/mobile-auth/phone-auth-handler.js

// auth.js
// Phone authentication handler for Hybrid Device Flow
// Handles QR scan → OAuth (Google or Microsoft) → Device authorization

import { createLogger } from '../../../utils/logger.js';
import { SUPABASE_CONFIG, API_CONFIG } from '../auth-config.js';
import { resolveBrand, applyBrandChrome } from './brand-config.js';

const logger = createLogger('PhoneAuth');

// Brand skin (?brand=chickadee → Chickadee copy/logo; default Dashie,
// unchanged). Resolved once — also persists itself for the OAuth round-trip.
const BRAND = resolveBrand();

// Supabase config
const EDGE_FUNCTION_URL = SUPABASE_CONFIG.edgeFunctionUrl;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const GOOGLE_CLIENT_ID = BRAND.googleWebClientId || SUPABASE_CONFIG.googleWebClientId;
const MICROSOFT_CLIENT_ID = SUPABASE_CONFIG.microsoftWebClientId;
const MICROSOFT_SCOPES = API_CONFIG.microsoft?.scopes;

class PhoneAuthHandler {
  constructor() {
    this.userCode = null;
    this.deviceCode = null;
    this.deviceType = null;
    // OAuth provider: 'google' (default) or 'microsoft'. Microsoft is only
    // used for secondary-adds (adding an Outlook calendar on a TV/tablet).
    this.provider = 'google';
    this.googleCredential = null;
    this.googleUser = null;
    // Optional scope override for per-action flows (e.g. Add Calendar Account
    // from a TV/tablet). Set from ?scopes= on the URL in init().
    this.scopeOverride = null;
    // Flow intent from ?intent= (set server-side in create_device_code).
    // 'add_account' = secondary calendar-account add — swaps the
    // "Authenticate Your Device" copy for account-add copy (FB15).
    this.intent = null;
  }

  /**
   * Initialize the phone auth handler
   */
  async init() {
    try {
      logger.info('Initializing phone auth handler');

      // Brand the static chrome (title/logo/product-name copy) before any
      // section becomes visible. No-op for the default Dashie brand.
      applyBrandChrome(BRAND, [
        '#confirm-account-section h2',
        '#confirm-account-section .instructions',
        '#confirm-account-section .privacy-note',
      ]);
      // Chickadee: make sign-UP explicit — most arrivals are brand-new, and
      // "authenticate your device" reads like you must already have an
      // account. (Dashie copy unchanged.)
      if (BRAND.id === 'chickadee') {
        const instr = document.querySelector('#sign-in-section .instructions');
        if (instr) instr.textContent =
          'Sign in with Google — new to Chickadee? The same button creates your account.';
      }

      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const message = params.get('message');
      this.userCode = params.get('code');
      this.deviceType = params.get('type') || 'firetv';
      this.provider = params.get('provider') === 'microsoft' ? 'microsoft' : 'google';
      // Scope override from TV-side (e.g. "Add Calendar" narrows to calendar scopes).
      // If absent, use the default scope set from auth-config.
      this.scopeOverride = params.get('scopes') || null;
      this.intent = params.get('intent') || null;

      logger.debug('URL parameters', {
        status,
        userCode: this.userCode,
        deviceType: this.deviceType,
        provider: this.provider,
        hasScopeOverride: !!this.scopeOverride,
        intent: this.intent,
      });

      // Swap device-authentication copy for account-add copy when this is a
      // secondary calendar-account add, before any section is shown.
      this.applyIntentCopy();

      // Check if redirected back from OAuth callback with status
      if (status === 'success') {
        logger.success('OAuth callback successful - showing success state');
        this.displayDeviceInfo();
        this.showSuccess();

        // Brands without a post-auth destination (Chickadee: no app to open —
        // the add-on panel polls and completes on its own) terminate here
        // with "return to Home Assistant" copy instead of redirecting.
        if (!BRAND.completeUrl) {
          const redirectNote = document.querySelector('#success-section .redirect-note');
          if (redirectNote) redirectNote.textContent = 'You can close this tab and return to Home Assistant.';
          const closeNote = document.querySelector('#success-section .close-note-alt');
          if (closeNote) closeNote.style.display = 'none';
          return;
        }

        // Auto-redirect to auth-complete page after showing success
        // This page will try to open the app if installed, or show download options
        setTimeout(() => {
          logger.info('Redirecting to auth-complete page...');

          // Set flag so mobile site knows this is a completed auth (skip login screen)
          sessionStorage.setItem('hybrid-auth-complete', 'true');

          // Redirect to auth-complete with device info
          const redirectUrl = `${BRAND.completeUrl}?type=${encodeURIComponent(this.deviceType || 'firetv')}&code=${encodeURIComponent(this.userCode || '')}`;
          window.location.href = redirectUrl;
        }, 1500);
        return;
      }

      if (status === 'error') {
        logger.error('OAuth callback failed', { message });
        this.displayDeviceInfo();
        this.showError('Authorization Failed', message || 'Unknown error occurred');
        return;
      }

      // If no user code, show code entry form
      if (!this.userCode) {
        this.showCodeEntryForm();
        return;
      }

      // Display device info
      this.displayDeviceInfo();

      // Show sign-in section (it's hidden by default in HTML)
      this.showSection('sign-in-section');

      // Initialize provider sign-in (Google or Microsoft)
      if (this.provider === 'microsoft') {
        this.initializeMicrosoftSignIn();
      } else {
        this.initializeGoogleSignIn();
      }

    } catch (error) {
      logger.error('Initialization failed', error);
      this.showError('Initialization Error', error.message);
    }
  }

  /**
   * Show the code entry form for manual code input
   */
  showCodeEntryForm() {
    logger.info('Showing code entry form');

    // Hide device info since we don't have a code yet
    const deviceInfo = document.getElementById('device-info');
    if (deviceInfo) {
      deviceInfo.classList.add('hidden');
    }

    // Show code entry section
    this.showSection('code-entry-section');

    const codeInput = document.getElementById('code-input');
    const submitButton = document.getElementById('submit-code-button');

    if (codeInput) {
      // Auto-focus the input
      setTimeout(() => codeInput.focus(), 100);

      // Format input as user types (add dash after 4 chars)
      codeInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Add dash after 4 characters
        if (value.length > 4) {
          value = value.slice(0, 4) + '-' + value.slice(4, 8);
        }

        e.target.value = value;

        // Remove error state on input
        codeInput.classList.remove('error');
      });

      // Handle Enter key
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitCode();
        }
      });
    }

    if (submitButton) {
      submitButton.addEventListener('click', () => this.submitCode());
    }
  }

  /**
   * Submit the manually entered code
   */
  submitCode() {
    const codeInput = document.getElementById('code-input');
    if (!codeInput) return;

    // Get value and normalize (remove dash, uppercase)
    let code = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Validate length (should be 8 characters)
    if (code.length !== 8) {
      codeInput.classList.add('error');
      codeInput.focus();
      logger.warn('Invalid code length', { length: code.length });
      return;
    }

    // Format as XXXX-XXXX for display and storage
    const formattedCode = code.slice(0, 4) + '-' + code.slice(4);

    logger.info('Code submitted', { code: formattedCode });

    // Set the user code and proceed
    this.userCode = formattedCode;

    // Update URL without reloading (for better UX and in case of refresh)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('code', formattedCode);
    window.history.replaceState({}, '', newUrl);

    // Show device info now that we have a code
    const deviceInfo = document.getElementById('device-info');
    if (deviceInfo) {
      deviceInfo.classList.remove('hidden');
    }

    // Display device info and proceed to sign-in
    this.displayDeviceInfo();
    this.showSection('sign-in-section');
    if (this.provider === 'microsoft') {
      this.initializeMicrosoftSignIn();
    } else {
      this.initializeGoogleSignIn();
    }
  }

  /**
   * Secondary-add flows (Settings/console "Add Calendar Account") arrive with
   * ?intent=add_account on the verification URL (appended server-side in
   * create_device_code). The default copy on this page describes device
   * authentication ("Authenticate Your Device"), which reads wrong when the
   * user is adding a calendar account — swap it for account-add copy (FB15).
   *
   * The Microsoft path already overwrites the sign-in instructions with its
   * own calendar-oriented copy in initializeMicrosoftSignIn(), so only the
   * Google strings are swapped here.
   */
  applyIntentCopy() {
    if (this.intent !== 'add_account') return;

    document.title = 'Add Calendar Account - Dashie';
    const heading = document.querySelector('.auth-header h1');
    if (heading) heading.textContent = 'Add a Calendar Account';

    const codeLabel = document.querySelector('.device-code-label');
    if (codeLabel) codeLabel.textContent = 'Confirmation Code:';

    if (this.provider === 'google') {
      const instructions = document.querySelector('#sign-in-section .instructions');
      if (instructions) {
        instructions.textContent = 'Sign in with the Google account whose calendars you want to add';
      }
      const privacyNote = document.querySelector('#sign-in-section .privacy-note');
      if (privacyNote) {
        privacyNote.textContent = "This account's calendars will be added to your Dashie dashboard";
      }
    }

    logger.debug('Applied add-account copy (intent=add_account)');
  }

  /**
   * Display device information
   */
  displayDeviceInfo() {
    const deviceCodeEl = document.getElementById('device-code');
    if (deviceCodeEl) deviceCodeEl.textContent = this.userCode;

    logger.debug('Device info displayed', {
      deviceType: this.deviceType,
      userCode: this.userCode
    });
  }

  /**
   * Initialize Google Sign-In button
   */
  initializeGoogleSignIn() {
    try {
      logger.debug('Initializing Google Sign-In button');

      // Check if we're on a local/development domain
      const isLocalDev = window.location.hostname.includes('local.') ||
                        window.location.hostname === 'localhost' ||
                        window.location.hostname.startsWith('127.0.0.1');

      if (isLocalDev) {
        logger.warn('Local development detected - skipping One Tap, using direct OAuth flow');

        // Just set up the button to go directly to OAuth
        const customButton = document.getElementById('custom-google-signin');
        if (customButton) {
          const handleSignIn = () => {
            logger.debug('Custom Google button clicked (direct OAuth)');
            this.initiateOAuthFlow();
          };

          customButton.addEventListener('click', handleSignIn);
          customButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSignIn();
            }
          });
          customButton.setAttribute('tabindex', '0');
          customButton.focus();

          logger.debug('Direct OAuth button configured');
        }
        return;
      }

      // Wait for Google library to load
      const waitForGoogle = () => {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          logger.debug('Google library loaded, initializing...');

          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: this.handleGoogleCallback.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Attach custom button click handler
          const customButton = document.getElementById('custom-google-signin');
          if (customButton) {
            const handleSignIn = () => {
              logger.debug('Custom Google button clicked');
              // Trigger Google One Tap
              google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  logger.warn('One Tap not shown, falling back to popup');
                  // If One Tap doesn't work, show the popup
                  this.initiateOAuthFlow();
                }
              });
            };

            // Handle mouse/touch clicks
            customButton.addEventListener('click', handleSignIn);

            // Handle keyboard/d-pad Enter
            customButton.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                logger.debug('Enter key pressed on Google button');
                handleSignIn();
              }
            });

            // Make button focusable for keyboard navigation
            customButton.setAttribute('tabindex', '0');

            // Auto-focus the button so d-pad works immediately
            customButton.focus();

            logger.debug('Google Sign-In button setup with keyboard support');
          }

          logger.success('Google Sign-In initialized with custom button');
        } else {
          logger.debug('Waiting for Google library to load...');
          setTimeout(waitForGoogle, 100);
        }
      };

      waitForGoogle();

    } catch (error) {
      logger.error('Failed to initialize Google Sign-In', error);
      this.showError('Setup Error', 'Failed to initialize Google Sign-In. Please refresh the page.');
    }
  }

  /**
   * Handle Google Sign-In callback
   * @param {Object} response - Google credential response
   */
  async handleGoogleCallback(response) {
    try {
      logger.info('Google Sign-In callback received');

      // Store the credential
      this.googleCredential = response.credential;

      // Decode the JWT to get user info (for display only)
      this.googleUser = this.parseJWT(this.googleCredential);

      logger.debug('Google user info', {
        email: this.googleUser.email,
        name: this.googleUser.name
      });

      // Hide sign-in section, show loading
      this.showSection('loading-section');
      this.updateStatus('Completing authentication with Google...');

      // Now we need to exchange the Google ID token for OAuth tokens
      // We'll use the Web OAuth flow to get access_token and refresh_token
      await this.initiateOAuthFlow();

    } catch (error) {
      logger.error('Google callback error', error);
      this.showError('Sign-In Failed', error.message);
    }
  }

  /**
   * Initiate OAuth flow to get access and refresh tokens
   */
  async initiateOAuthFlow() {
    try {
      logger.info('Initiating OAuth flow to get tokens');

      // Store device code in session storage for callback
      sessionStorage.setItem('hybrid_device_user_code', this.userCode);
      sessionStorage.setItem('hybrid_device_type', this.deviceType);
      // Carry the flow intent across the OAuth round-trip so the callback
      // page can label the linking step correctly (add_account vs device).
      if (this.intent) sessionStorage.setItem('hybrid_device_intent', this.intent);
      else sessionStorage.removeItem('hybrid_device_intent');

      // Build OAuth URL. Use scope override from URL if present (per-action
      // flow like "Add Calendar"), otherwise the full default scope set.
      const redirectUri = window.location.origin + '/oauth-callback.html';
      // Per-action override (Add Calendar) wins; then the brand's scope set
      // (Chickadee = identity only); then the full Dashie default.
      const scope = this.scopeOverride || BRAND.googleScopes || API_CONFIG.google.scopes;
      // For primary sign-in we want include_granted_scopes=true (merges with
      // existing grants). For per-action overrides we want it false so the
      // consent is isolated to the narrower scopes we actually requested.
      const includeGranted = this.scopeOverride ? 'false' : 'true';

      // Build OAuth parameters
      const oauthParams = {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: includeGranted,
        state: 'hybrid_device_flow'
      };

      // Add login_hint only if we have the email from One Tap
      if (this.googleUser?.email) {
        oauthParams.login_hint = this.googleUser.email;
        logger.debug('Using login_hint from One Tap', { email: this.googleUser.email });
      }

      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams(oauthParams);

      logger.debug('Redirecting to OAuth', {
        redirectUri,
        userEmail: this.googleUser?.email || 'none (direct OAuth flow)'
      });

      // Redirect to Google OAuth
      window.location.href = authUrl;

    } catch (error) {
      logger.error('OAuth flow initiation failed', error);
      this.showError('OAuth Error', error.message);
    }
  }

  /**
   * Swap the sign-in UI from Google to Microsoft and wire up the MS button.
   * Microsoft is secondary-add only — the TV-side HybridDeviceAuth always
   * passes a scopeOverride for this path, and the backend rejects MS primary
   * sign-in.
   */
  initializeMicrosoftSignIn() {
    logger.debug('Initializing Microsoft sign-in UI');

    // Update instructions + success device copy to reflect provider.
    const instructionsEl = document.querySelector('#sign-in-section .instructions');
    if (instructionsEl) {
      instructionsEl.textContent = 'Sign in with Microsoft to connect your calendar';
    }
    const privacyNote = document.querySelector('#sign-in-section .privacy-note');
    if (privacyNote) {
      privacyNote.textContent = 'Your calendar will be linked to your Dashie device';
    }

    // Swap button visuals: hide Google button, show Microsoft button. The
    // MS button is added to index.html alongside the Google one.
    const googleBtn = document.getElementById('custom-google-signin');
    if (googleBtn) googleBtn.classList.add('hidden');

    const msBtn = document.getElementById('custom-microsoft-signin');
    if (!msBtn) {
      logger.error('Microsoft sign-in button not found in DOM');
      this.showError('Setup Error', 'Microsoft sign-in button missing. Please refresh.');
      return;
    }
    msBtn.classList.remove('hidden');
    msBtn.setAttribute('tabindex', '0');

    const handleSignIn = () => {
      logger.debug('Microsoft sign-in button clicked');
      this.initiateMicrosoftOAuthFlow();
    };
    msBtn.addEventListener('click', handleSignIn);
    msBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSignIn();
      }
    });
    setTimeout(() => msBtn.focus(), 50);
  }

  /**
   * Redirect to Microsoft OAuth for the hybrid device flow. The callback
   * lands on `/oauth-callback.html` with state = `microsoft_hybrid_device_flow`;
   * callback.html detects the MS state, exchanges via `exchange_microsoft_code`,
   * and calls `authorize_device_code` with provider='microsoft'.
   */
  async initiateMicrosoftOAuthFlow() {
    try {
      logger.info('Initiating Microsoft OAuth flow');

      if (!MICROSOFT_CLIENT_ID) {
        throw new Error('Microsoft client ID not configured');
      }

      sessionStorage.setItem('hybrid_device_user_code', this.userCode);
      sessionStorage.setItem('hybrid_device_type', this.deviceType);
      sessionStorage.setItem('hybrid_device_provider', 'microsoft');
      if (this.intent) sessionStorage.setItem('hybrid_device_intent', this.intent);
      else sessionStorage.removeItem('hybrid_device_intent');

      const redirectUri = window.location.origin + '/oauth-callback.html';
      // Default to the Microsoft scope set unless the TV-side passed a
      // narrower override via ?scopes= (future-proofing — Microsoft is
      // secondary-add only today so this normally matches default scopes).
      const scope = this.scopeOverride || MICROSOFT_SCOPES;

      const params = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        response_mode: 'query',
        prompt: 'select_account',
        state: 'microsoft_hybrid_device_flow',
      });

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
      logger.debug('Redirecting to Microsoft OAuth', { redirectUri });
      window.location.href = authUrl;
    } catch (error) {
      logger.error('Microsoft OAuth flow initiation failed', error);
      this.showError('OAuth Error', error.message);
    }
  }

  /**
   * Authorize device code (called after OAuth callback returns tokens)
   * @param {Object} tokens - OAuth tokens from callback
   * @param {boolean} [allowCreate=false] - When true, the backend may create
   *   a new Dashie account if none exists. Set only after the user has
   *   confirmed account creation via the no-account prompt. When false, the
   *   backend returns a `no_account` status instead of silently creating.
   */
  async authorizeDeviceCode(tokens, allowCreate = false) {
    // Stash the tokens so the no-account confirm prompt can re-call this
    // with allowCreate=true without re-running the OAuth round-trip.
    this._pendingAuthTokens = tokens;
    try {
      logger.info('Authorizing device code with backend', { allowCreate });

      // Generic copy works for all callers — TV, HA addon, web Console
      // — without misnaming what the user is doing. Specialize only when
      // the intent/device type unambiguously implies a meaningful label.
      if (this.intent === 'add_account') {
        this.updateStatus('Linking your calendar account...');
      } else {
        const deviceLabel = this.deviceType === 'ha_app' ? 'Home Assistant app' : 'device';
        this.updateStatus(`Linking your ${deviceLabel}...`);
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`  // Unauthenticated operation
        },
        body: JSON.stringify({
          operation: 'authorize_device_code',
          googleAccessToken: tokens.access_token,
          data: {
            device_code: this.userCode,  // Using user_code as identifier
            allow_create: allowCreate === true,
            google_tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_in: tokens.expires_in || 3600,
              scope: tokens.scope
            }
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // No Dashie account exists for the Google email the user picked.
      // Confirm before creating — guards against signing in with the wrong
      // Google account silently provisioning a brand-new empty account.
      if (data.status === 'no_account') {
        logger.info('Device auth: no Dashie account for this email — prompting', {
          email: data.email
        });
        this.showAccountConfirm(data.providerProfile || { email: data.email });
        return;
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Device authorization failed');
      }

      logger.success('Device authorized successfully', {
        userEmail: data.user?.email
      });

      // Store the phone JWT and redirect to dashboard
      if (data.jwtToken) {
        // Parse JWT to get expiry and user info
        const payload = this.parseJWT(data.jwtToken);

        // Store JWT with metadata (same format as EdgeClient expects)
        const jwtData = {
          jwt: data.jwtToken,
          expiry: payload.exp ? payload.exp * 1000 : Date.now() + (72 * 60 * 60 * 1000),
          userId: payload.sub,
          userEmail: payload.email,
          savedAt: Date.now()
        };

        // D.68 — capture the prior user ID BEFORE overwriting, so we can
        // detect an account switch on this phone (Jack signed in → confirm
        // a device for Charlie → phone's session now belongs to Charlie).
        // Without this, sessionManager.user (in-memory from the prior
        // sign-in) still reads as Jack while every other surface uses the
        // fresh Charlie JWT, producing "Hi Jack" with a Charlie logout.
        let priorUserId = null;
        try {
          const raw = localStorage.getItem('dashie-user-data');
          if (raw) priorUserId = JSON.parse(raw)?.id || null;
        } catch (_) { /* malformed json — treat as no prior user */ }

        localStorage.setItem('dashie-supabase-jwt', JSON.stringify(jwtData));

        // Also store user display data. Include id so the session-manager's
        // clearStaleUserCachesIfUserChanged() can detect an account switch
        // on the next bootstrap (it keys off userData.id, which we used to
        // omit here — the missing field broke its switch detection).
        if (data.user) {
          const userData = {
            id: payload.sub,
            name: data.user.name || data.user.email,
            picture: data.user.picture || null
          };
          localStorage.setItem('dashie-user-data', JSON.stringify(userData));
        }

        logger.success('Phone authenticated - JWT stored');

        // D.68 — if the phone just switched users (different sub claim),
        // hard-reload so sessionManager.user re-bootstraps from the new
        // JWT. The mobile dashboard's nav-bar greeting reads from
        // sessionManager.user.name (in-memory), which isn't refreshed by
        // simply rewriting localStorage. The TV / desktop hybrid auth
        // flow always reloads on completion; the iOS phone side was
        // skipping that step and ended up with mixed-account UI.
        const newUserId = payload.sub;
        if (newUserId && priorUserId && newUserId !== priorUserId) {
          logger.info('Phone auth: user changed — reloading to re-bootstrap session', {
            priorUserId, newUserId
          });
          // Small defer so the JWT/localStorage writes are guaranteed
          // committed before the navigation tears down this context.
          setTimeout(() => { window.location.reload(); }, 50);
          return;
        }
        // Phone gets JWT - no need to show success screen since we're authorizing the TV
        // The success will be shown when redirected back from oauth-callback
      } else {
        // No JWT returned - shouldn't happen
        logger.warn('No JWT returned from device authorization');
      }

    } catch (error) {
      logger.error('Device authorization failed', error);
      this.showError('Authorization Failed', error.message);
    }
  }

  /**
   * Parse JWT token (client-side only for display)
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Failed to parse JWT', error);
      return {};
    }
  }

  /**
   * Show a specific section, hide others
   * @param {string} sectionId - ID of section to show
   */
  showSection(sectionId) {
    const sections = ['code-entry-section', 'sign-in-section', 'loading-section', 'confirm-account-section', 'success-section', 'error-section'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (id === sectionId) {
          element.classList.remove('hidden');
        } else {
          element.classList.add('hidden');
        }
      }
    });
  }

  /**
   * Update status message
   * @param {string} message - Status message
   */
  updateStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Show success state
   */
  showSuccess() {
    // Hide device info on success
    document.body.classList.add('auth-complete');
    this.showSection('success-section');

    // Add keyboard handler for dashboard link
    setTimeout(() => {
      const dashboardLink = document.getElementById('dashboard-link');
      if (dashboardLink) {
        // Update href to auth-complete page
        const redirectUrl = `/auth-complete?type=${encodeURIComponent(this.deviceType || 'firetv')}&code=${encodeURIComponent(this.userCode || '')}`;
        dashboardLink.href = redirectUrl;

        dashboardLink.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            logger.debug('Enter key pressed on dashboard link');
            window.location.href = redirectUrl;
          }
        });

        logger.debug('Dashboard link keyboard handler added');
      }
    }, 100);

    logger.success('Authentication complete - showing success state');
  }

  /**
   * Show the "no Dashie account — create one?" confirmation. Surfaced when
   * the backend returns a `no_account` status: the user signed in with a
   * Google email that has no Dashie account. Confirming re-runs the device
   * authorization with allow_create=true; cancelling returns to sign-in so
   * they can retry with a different Google account.
   * @param {{email:string, name?:string, picture?:string}} profile
   */
  showAccountConfirm(profile) {
    const displayName = profile.name || profile.email;

    const nameEl = document.getElementById('confirm-account-name');
    const emailEl = document.getElementById('confirm-account-email');
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = profile.email;

    this.showSection('confirm-account-section');

    const createBtn = document.getElementById('confirm-create-button');
    const cancelBtn = document.getElementById('confirm-cancel-button');

    if (createBtn) {
      // Clone to drop any handler from a prior prompt in the same session.
      const fresh = createBtn.cloneNode(true);
      createBtn.parentNode.replaceChild(fresh, createBtn);
      const onCreate = () => {
        logger.info('User confirmed account creation — retrying device auth');
        if (this._pendingAuthTokens) {
          this.updateStatus(`Creating your ${BRAND.productName} account...`);
          this.showSection('loading-section');
          this.authorizeDeviceCode(this._pendingAuthTokens, true);
        } else {
          this.showError('Sign-In Error', 'Sign-in session expired. Please try again.');
        }
      };
      fresh.addEventListener('click', onCreate);
      fresh.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); onCreate(); }
      });
      fresh.setAttribute('tabindex', '0');
      setTimeout(() => fresh.focus(), 100);
    }

    if (cancelBtn) {
      const fresh = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(fresh, cancelBtn);
      const onCancel = () => {
        logger.info('User declined account creation — returning to sign-in');
        this._pendingAuthTokens = null;
        this.showSection('sign-in-section');
      };
      fresh.addEventListener('click', onCancel);
      fresh.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); onCancel(); }
      });
      fresh.setAttribute('tabindex', '0');
    }

    logger.info('Showing no-account confirmation prompt', { email: profile.email });
  }

  /**
   * Show error state
   * @param {string} title - Error title
   * @param {string} message - Error message
   */
  showError(title, message) {
    // Hide device info on error
    document.body.classList.add('auth-complete');

    const titleEl = document.getElementById('error-title');
    const messageEl = document.getElementById('error-message');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    this.showSection('error-section');

    // Auto-focus the Try Again button and add keyboard handler
    setTimeout(() => {
      const tryAgainButton = document.getElementById('try-again-button');
      if (tryAgainButton) {
        tryAgainButton.focus();

        // Add keyboard handler for Enter key
        tryAgainButton.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            logger.debug('Enter key pressed on Try Again button');
            location.reload();
          }
        });

        logger.debug('Try Again button focused and keyboard handler added');
      }
    }, 100); // Small delay to ensure section is visible

    logger.error('Showing error state', { title, message });
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const handler = new PhoneAuthHandler();
  window.phoneAuthHandler = handler;  // Make available globally for OAuth callback
  handler.init();
});
