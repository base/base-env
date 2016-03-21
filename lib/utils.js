'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('base:base-env:utils');
var define = require('define-property');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-ignore-line

require('extend-shallow', 'extend');
require('define-property');
require('global-modules', 'gm');
require('is-absolute');
require('kind-of', 'typeOf');
require('resolve');
require = fn; // eslint-ignore-line

// utils.isValidModule = function() {};
// utils.isValidPath = function() {};
// utils.isValidName = function() {};
// utils.isValidApp = function() {};

utils.isValidModule = function(env, options) {
  options = options || {};
  if (typeof options.isValidModule === 'function') {
    return options.isValidModule;
  }
  return function(name, env) {
    return true;
  };
};

utils.isApp = function(val) {
  return (utils.isObject(val) && (val.isApp || val.isBase))
    || typeof val === 'function'
    || typeof val === 'string';
};

utils.functionName = function(env) {
  return 'function' + (env.fn.name ? (' ' + env.fn.name) : '');
};

/**
 * Return true if val is an object
 */

utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

/**
 * Return true if `filepath` exists on the file system
 */

utils.exists = function(name) {
  try {
    fs.lstatSync(name);
    return true;
  } catch (err) {};

  try {
    var fp = path.resolve('node_modules', name);
    fs.lstatSync(fp);
    return true;
  } catch (err) {}

  try {
    var fp = path.resolve(utils.gm, name);
    fs.lstatSync(fp);
    return true;
  } catch (err) {}
  return false;
};

/**
 * Return the given value unchanged
 */

utils.identity = function(val) {
  return val;
};

/**
 * Resolve the given file path to global node_modules if prefixed with `npm:`
 */

utils.resolveDir = function(fp) {
  if (fp.indexOf('npm:') === 0) {
    return path.resolve(utils.gm, fp.slice(4));
  }
  return path.resolve(fp);
};

/**
 * Resolve the absolute path for the given module `name`.
 * If `name` is a file, `resolve.sync` is called, otherwise
 * `require.resolve` is called.
 */

utils.resolveModule = function(name) {
  if (utils.exists(name)) {
    return utils.resolve.sync(name);
  }
  return require.resolve(name);
};

/**
 * Try to resolve the given module name. If the module is not resolved,
 * a message is logged but the currently running process is not interrupted.
 */

utils.tryResolve = function(name) {
  try {
    return utils.resolveModule(name);
  } catch (err) {}

  var fp = utils.resolveDir(name);
  try {
    return utils.resolveModule(fp);
  } catch (err) {}

  try {
    fp = path.resolve(utils.gm, name);
    return utils.resolveModule(fp);
  } catch (err) {}

  fp = path.resolve('node_modules', name);
  try {
    return utils.resolveModule(fp);
  } catch (err) {
    throw err;
  }
};

/**
 * Decorate a `define` method on `env`
 */

utils.define = function(env) {
  define(env, 'define', function(prop, val) {
    var key = '_' + prop;
    define(this, key, this[key] || null);
    define(this, prop, val);
  });
};

/**
 * Decorate an `alias` method on `env`
 */

utils.alias = function(env) {
  env.define('alias', {
    set: function(alias) {
      this._alias = alias;
    },
    get: function() {
      var fn = this.aliasFn || utils.identity;
      var name = path.basename(this.key);
      return this._alias || (this._alias = fn.call(this.instance, name));
    }
  });
};

/**
 * Decorate a `namespace` method on `env`
 */

utils.namespace = function(env) {
  var custom;
  env.define('namespace', {
    set: function(val) {
      custom = val;
    },
    get: function() {
      var namespace = custom || env.alias;
      var parentName = env.parent && env.parent.namespace;
      if (typeof parentName !== 'undefined') {
        namespace = parentName + '.' + namespace;
      }
      return namespace;
    }
  });
};

/**
 * Expose `utils`
 */

module.exports = utils;
