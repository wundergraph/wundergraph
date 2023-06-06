const { getDefaultConfig } = require('expo/metro-config');
const { wgMetroConfig } = require('@wundergraph/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(defaultConfig);
