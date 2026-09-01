const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) ships a .wasm module that Metro must
// treat as an asset so the worker can load it at runtime on the web build.
if (config.resolver) {
  config.resolver.assetExts = config.resolver.assetExts ?? [];
  if (!config.resolver.assetExts.includes('wasm')) {
    config.resolver.assetExts.push('wasm');
  }
}

module.exports = config;
