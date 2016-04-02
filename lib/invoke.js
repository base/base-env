'use strict';

var debug = require('debug')('base:base-env:invoke');
var utils = require('./utils');
var clone = require('../clone2');

module.exports = function invoke(env, app, options) {
  debug('invoking "%s"', env.name);
  if (!utils.isApp(app)) {
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
  if (!utils.isApp(app)) {
    app = env.instance;
  }

  // if app exists and app !== env.app, update parent
  else if (utils.isApp(app) && !app.parent && env.instance) {
    app.define('parent', env.instance);
  }

  if (app && app.parent) {
    app.define('parent', app.parent);
  }

  options = options || {};

  // merge options
  merge(app, options);
  var foo = clone(app);

  // env object to `app`
  foo.env = env;

  foo.namespace += '.' + env.namespace;
  foo.use(env.fn, options);
  env.app = foo;
  return foo;
};

/**
 * Merge options onto `app.options`. Use `app.option()` method
 * if one exists.
 */

function merge(app, options) {
  if (!app) return;
  if (typeof app.option === 'function') {
    app.option(options);
  } else {
    var opts = utils.merge({}, app.options, options);
    utils.merge(options, opts);
  }
}
