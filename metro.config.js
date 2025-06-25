const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable symlinks and clear cache more thoroughly
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.symlinks = false;

// Clear Metro cache on startup in development
if (process.env.NODE_ENV === 'development') {
  config.resetCache = true;
}

module.exports = config;
