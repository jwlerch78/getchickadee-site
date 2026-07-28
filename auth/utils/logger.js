// logger.js — SITE-OWNED SHIM (not vendored).
//
// The real Dashie logger (dashieapp_staging js/utils/logger.js, ~700 lines +
// logger-config.js) is far more than the standalone auth pages need. This shim
// matches the `createLogger(name) -> { debug, info, warn, error, success }`
// surface the vendored auth code imports, backed by console.
//
// If the vendored auth code starts calling a logger method not defined here,
// it'll throw a loud, catchable TypeError — that's the signal to add it (a
// visible miss, per the no-silent-drops rule), not a silent no-op.

export function createLogger(name) {
  const tag = `[${name}]`;
  return {
    debug:   (...a) => console.debug(tag, ...a),
    info:    (...a) => console.info(tag, ...a),
    warn:    (...a) => console.warn(tag, ...a),
    error:   (...a) => console.error(tag, ...a),
    success: (...a) => console.info(tag, '✓', ...a),
  };
}

export default { createLogger };
