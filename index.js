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

  return function(app) {
    if (this.isRegistered('base-env')) return;
    debug('initializing');

    if (typeof this.run !== 'function') {
      throw new TypeError('expected base-plugins to be registered');
    }

    /**
     * Getter/setter for adding a `namespace` property to `app`. This
     * will be removed when `base-namespace` is published
     */

    if (typeof this.namespace === 'undefined') {
      var namespace = null;
      this.define('namespace', {
        configurable: true,
        set: function(val) {
          namespace = val;
        },
        get: function() {
          var name = namespace || this._name;
          return this.parent ? (this.parent.namespace + '.' + name) : name;
        }
      });
    }

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

      // if the last argument is a function or string, then swap
      // `val` and `options`
      if (typeof options === 'function' || typeof options === 'string') {
        var temp = options;
        options = val;
        val = temp;
      }

      // if val is an object, and not an instance of `base`, then
      // we can assume it's an options object
      if (utils.typeOf(val) === 'object' && !val.isBase) {
        options = val;
        val = name;
      }

      var opts = utils.extend({instance: this}, config, options);
      if (typeof val === 'undefined') {
        opts.isPath = true;
        val = name;
      }

      if (name === '' || typeof name !== 'string') {
        throw new TypeError('expected name to be a string');
      }

      function env(app, val) {
        var aliasFn = opts.toAlias || app.toAlias;
        return utils.extend({ aliasFn: aliasFn }, opts, val);
      }

      switch (utils.typeOf(val)) {
        case 'string':
          return new EnvPath(name, env(this, { path: val }));
        case 'object':
          return new EnvApp(name, env(this, { app: val }));
        case 'function':
          return new EnvFn(name, env(this, { fn: val }));
        default: {
          throw new Error('cannot create env for "' + name + '" from "' + val + '"');
        }
      }
    });
  };
};
