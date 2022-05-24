// package.json is not part of the build result, we need to look at the root level
const pkg = require('./../../package.json');

export const SDK_VERSION = pkg.version;
