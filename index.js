/*!
 * base-env <https://github.com/jonschlinkert/base-env>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var debug = require('debug')('base:base-env');
var utils = require('./lib/utils');
var EnvPath = require('./lib/path');
var EnvApp = require('./lib/app');
var EnvFn = require('./lib/fn');

module.exports = function(config) {
  config = config || {};

  return function baseEnv(app) {
    if (!isValidInstance(this)) return;
    debug('initializing');

    /**
     * Create an `env` object with the given `name`, function, filepath
     * or app instance, and options.
     *
     * @param {String} `name`
     * @param {Object|Function|String} `val`
     * @param {Object} `options`
     * @return {Object}
     * @api public
     */

    this.define('createEnv', function(name, val, options) {
      debug('createEnv: "%s"', name);

      if (name === '' || typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }

      options = options || {};

      if (utils.isAppArg(options)) {
        var temp = options;
        options = val;
        val = temp;
      }

      // if val is an object, and not an instance of `base`, then
      // we can assume it's an options object
      if (utils.isObject(val) && !utils.isAppArg(val)) {
        options = val;
        val = name;
      }

      var opts = utils.merge({instance: this}, config, options);
      if (typeof val === 'undefined') {
        opts.isPath = true;
        val = name;
      }

      function env(val) {
        return utils.merge({}, opts, val);
      }

      switch (utils.typeOf(val)) {
        case 'string':
          this.env = new EnvPath(name, env({ path: val }), this);
          break;
        case 'object':
          this.env = new EnvApp(name, env({ app: val }), this);
          break;
        case 'function':
          this.env = new EnvFn(name, env({ fn: val }), this);
          break;
        default: {
          throw new Error('cannot create env for "' + name + '" from "' + val + '"');
        }
      }

      return this.env;
    });

    return baseEnv;
  };
};

function isValidInstance(app) {
  var fn = app.options.validatePlugin;
  if (typeof fn === 'function' && !fn(app)) {
    return false;
  }
  if (app.isView || app.isList || app.isCollection || app.isItem) {
    return false;
  }
  if (app.isRegistered('base-env')) {
    return false;
  }
  return true;
}
