'use strict';

var debug = require('debug')('base:base-env:invoke');
var utils = require('./utils');

module.exports = function invoke(env, app, options) {
  debug('invoking "%s"', env.name);
  if (!utils.isApp(app)) {
    options = app;
    app = {};
  }

  // if an `app` is not passed, use the `app` on env, or the
  // instance that was used to create `env` (we've already returned
  // if `env.fn` is not a function, so this is just the instance
  // used to invoke `env.fn`)
  if (!utils.isApp(app)) {
    app = env.app || env.instance;

  } else if (utils.isApp(app) && !app.parent && env.instance) {
    // if app exists and app !== env.app, update parent
    app.define('parent', env.instance);
  }

  if (app && app.parent) {
    app.define('parent', app.parent);
  }

  options = options || {};

  // merge options
  mergeOptions(app, options);

  // env object to `app`
  app.env = env;
  env.namespace = (app.namespace || app._namespace) + '.' + env.namespace;
  app.use(env.fn, options);
  env.app = app;
  return app;
};

/**
 * Merge options onto `app.options`. Use `app.option()` method
 * if one exists.
 */

function mergeOptions(app, options) {
  if (typeof app.option === 'function') {
    app.option(options);
  } else {
    var opts = utils.merge({}, app.options, options);
    utils.merge(options, opts);
  }
}
