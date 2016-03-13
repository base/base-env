'use strict';

var debug = require('debug')('base:base-env:invoke');
var utils = require('./utils');

module.exports = function invoke(env, app, options) {
  debug('invoking "%s"', env.name);

  if (!isApp(app)) {
    options = app;
    app = {};
  }

  if (utils.isObject(env.app) && !env.fn) {
    merge(env.app, options);
    return env.app;
  }

  // if an `app` is not passed, use the `app` on env, or the
  // instance that was used to create `env` (we've already returned
  // if `env.fn` is not a function, so this is just the instance
  // used to invoke `env.fn`)
  if (!isApp(app)) {
    app = env.app || env.instance;
  }

  // if app exists and app !== env.app, update parent
  else if (isApp(app) && !app.parent) {
    app.parent = env.instance;
  }

  // env object to `app`
  app.env = env;

  // merge in options
  merge(app, options);

  app.namespace = env.alias;
  app.use(env.fn, options);
  env.app = app;
  return app;
};

function isApp(app) {
  return utils.isObject(app) && app.isBase;
}

/**
 * Merge options onto `app.options`. Use `app.option()` method
 * if one exists.
 */

function merge(app, options) {
  if (!options || !app) return;
  if (typeof app.option === 'function') {
    app.option(options);
  } else {
    app.options = utils.extend({}, app.options, options);
  }
}
