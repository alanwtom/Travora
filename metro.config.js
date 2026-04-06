const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude the flight-price-api directory and all its contents from Metro bundling
config.resolver.blockList = [
  /flight-price-api\/.*/,
  /flight-price-api$/,
  ...(config.resolver.blockList || []),
];

module.exports = config;