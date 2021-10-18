const { assertSupportedNodeVersion } = require('../src/Engine');

module.exports = () => {
    assertSupportedNodeVersion();

    const config = await import('./webpack.config.mjs');

    return await config.default();
};
