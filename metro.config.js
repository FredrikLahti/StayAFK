// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) ships a .wasm asset that Metro
// doesn't resolve as a module by default.
config.resolver.assetExts.push('wasm');

// expo-sqlite's web backend needs cross-origin isolation (COOP/COEP) to use
// OPFS storage in the browser.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
