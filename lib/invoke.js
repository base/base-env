'use strict';

var extend = require('extend-shallow');

module.exports = function invoke(env, app, options) {
  if (env.app && !env.fn) {
    env.app.options = extend({}, env.app.options, options);
    return env.app;
  }
  if (typeof env.fn !== 'function') {
    throw new Error('expected env.fn to be a function. cannot create an instance');
  }
  if (typeof app === 'undefined') {
    throw new Error('expected app to be an object');
  }

  app.use(env.fn, app.base);
  env.app = app;
  return app;
};
