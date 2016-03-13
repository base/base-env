'use strict';

var extend = require('extend-shallow');
var invoke = require('./invoke');
var utils = require('./utils');

function EnvFn(name, env) {
  env = env || {};
  this.isEnv = true;

  this.pkg = {};
  this.key = name;
  this.name = name;
  extend(this, env);

  if (name === '' || typeof name !== 'string') {
    throw new TypeError('expected name to be a string');
  }

  // add namespace getter to the instance
  utils.namespace(this);

  // fallback alias function
  utils.aliasFn(this);

  // decorate `define` method
  utils.define(this);

  this.define('alias', {
    set: function(alias) {
      this._alias = alias;
    },
    get: function() {
      if (this._alias) return this._alias;
      if (typeof this.aliasFn !== 'function') {
        throw new Error('expected env.aliasFn to be a function. cannot set env.alias');
      }
      return (this._alias = (this.aliasFn(this.name) || this._name));
    }
  });
}

EnvFn.prototype.inspect = function(str) {
  return '<Env "' + this.namespace + '" [function]>';
};

EnvFn.prototype.isMatch = function(str) {
  return this.key === str || this.name === str || this.alias === str;
};

EnvFn.prototype.invoke = function(app, base, options) {
  return invoke(this, app, base, options);
};

/**
 * Expose `PathEnv`
 */

module.exports = EnvFn;
