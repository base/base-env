/*!
 * base-env <https://github.com/jonschlinkert/base-env>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var typeOf = require('kind-of');
var extend = require('extend-shallow');
var EnvPath = require('./lib/path');
var EnvApp = require('./lib/app');
var EnvFn = require('./lib/fn');

module.exports = function(config) {
  config = config || {};

  return function(app) {
    if (this.isRegistered('base-env')) return;

    if (typeof this.run !== 'function') {
      throw new TypeError('expected base-plugins to be registered');
    }

    this.define('createEnv', function(name, val, options) {
      if (typeOf(val) === 'object' && !val.isBase) {
        options = val;
        val = name;
      }

      var opts = extend({parent: this.parent}, config, options);
      val = val || name;

      switch (typeOf(val)) {
        case 'string':
          this.env = new EnvPath(name, extend(opts, {path: val}));
          break;
        case 'object':
          this.env = new EnvApp(name, extend(opts, {app: val}));
          break;
        case 'function':
          this.env = new EnvFn(name, extend(opts, {fn: val}));
          break;
        default: {
          throw new Error('cannot create env for "' + name + '" from "' + val + '"');
        }
      }
      return this.env;
    });
  };
};
