// Learn more https://docs.expo.io/guides/customizing-metro
const { withWunderGraphConfig } = require('@wundergraph/expo');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = withWunderGraphConfig(config);
