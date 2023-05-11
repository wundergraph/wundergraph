// Learn more https://docs.expo.io/guides/customizing-metro
const { wgMetroConfig } = require('@wundergraph/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(config);
