const baseConfig = require('flarum-webpack-config')();

// Override externals to support both Flarum 1.x (flarum.core.compat) and 2.x (flarum.reg)
module.exports = {
  ...baseConfig,
  externals: [
    { jquery: 'jQuery' },
    function ({ request }, callback) {
      let matches;
      if ((matches = /^flarum\/(.+)$/.exec(request))) {
        const id = matches[1];
        return callback(
          null,
          `root (flarum.core&&flarum.core.compat&&flarum.core.compat['${id}']||flarum.reg&&flarum.reg.get('core','${id}'))`
        );
      }
      callback();
    },
  ],
};
