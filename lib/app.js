'use strict';

var debug = require('debug')('base:base-env:instance');
var invoke = require('./invoke');
var utils = require('./utils');

function EnvApp(name, env) {
  debug('creating env for "%s"', name);

  this.isEnv = true;
  this.pkg = {};
  this.key = name;
  this.name = name;

  // decorated methods onto `env`
  utils.define(this);
  utils.namespace(this);
  utils.alias(this);

  for (var key in env) {
    this[key] = env[key];
  }
}

/**
 * Custom inspect function.
 */

EnvApp.prototype.inspect = function(str) {
  return '<Env "' + this.namespace + '" [instance]>';
};

/**
 * Returns true if the given `str` matches `env.key`, `env.name` or `env.alias`.
 *
 * @param {String} `str` The string to match
 * @return {Boolean} Retuns true if a match is made.
 * @api public
 */

EnvApp.prototype.isMatch = function(str) {
  return this.key === str || this.name === str || this.alias === str;
};

/**
 * When `env` is created from an existing application instance, the
 * instance is cached on `env.app` and `env.invoke` is a noop function
 * that simply returns `env.app`.
 *
 * ```js
 * var foo = new Base();
 * var bar = new Base();
 *
 * var env = foo.createEnv('bar', bar);
 * var app = env.fn();
 * console.log(app);
 * //=> returns the "bar" instance
 * ```
 * @return {Object} Returns the invoked instance.
 * @api public
 */

EnvApp.prototype.invoke = function(app, options) {
  return invoke(this, app, options);
};

/**
 * Expose `EnvApp`
 */

module.exports = EnvApp;
