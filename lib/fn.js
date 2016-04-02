'use strict';

var debug = require('debug')('base:base-env:fn');
var invoke = require('./invoke');
var utils = require('./utils');

function EnvFn(name, env, app) {
  debug('creating env for "%s"', name);

  this.instance = app;
  this.isEnv = true;
  this.pkg = {};
  this.key = name;
  this.name = name;

  // decorate methods onto `env`
  utils.define(this);
  utils.alias(this);
  utils.namespace(this);

  for (var key in env) {
    if (!(key in this)) {
      this[key] = env[key];
    }
  }
}

/**
 * Custom inspect function.
 */

EnvFn.prototype.inspect = function(str) {
  return '<Env "' + this.namespace + '" [' + utils.functionName(this) + ']>';
};

/**
 * Returns true if the given `str` matches `env.key`, `env.name` or `env.alias`.
 *
 * @param {String} `str` The string to match
 * @return {Boolean} Retuns true if a match is made.
 */

EnvFn.prototype.isMatch = function(str) {
  return this.key === str || this.name === str || this.alias === str;
};

/**
 * Invoke `env.fn` with the given `context` and `options`.
 *
 * ```js
 * var app = new Base();
 * env.fn(app);
 * ```
 * @param {Object} `context` The application instance to use for invoking `env.fn`
 * @param {Object} `opptions`
 * @return {Object}
 */

EnvFn.prototype.invoke = function(app, options) {
  return invoke(this, app, options);
};

/**
 * Expose `PathEnv`
 */

module.exports = EnvFn;
