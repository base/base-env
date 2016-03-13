'use strict';

var extend = require('extend-shallow');
var utils = require('./utils');

function EnvApp(name, env) {
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
      return (this._alias = this.aliasFn(this.name));
    }
  });
}

EnvApp.prototype.inspect = function(str) {
  return '<Env "' + this.namespace + '" [instance]>';
};

EnvApp.prototype.isMatch = function(str) {
  return this.key === str || this.name === str || this.alias === str;
};

EnvApp.prototype.invoke = function() {
  return this.app;
};

/**
 * Expose `EnvApp`
 */

module.exports = EnvApp;
