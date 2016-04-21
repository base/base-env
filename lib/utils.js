'use strict';

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-ignore-line

require('mixin-deep', 'merge');
require('define-property');
require('global-modules', 'gm');
require('os-homedir', 'home');
require('is-absolute');
require('kind-of', 'typeOf');
require('resolve');
require = fn; // eslint-ignore-line

utils.isApp = function(val) {
  return (utils.isObject(val) && (val.isApp || val.isBase));
};

utils.isAppArg = function(val) {
  return utils.isApp(val)
    || typeof val === 'function'
    || typeof val === 'string';
};

utils.instanceName = function(env) {
  var name = env.app && (env.app.namespace || env.app._namespace || env.app._name);
  return 'instance' + (name ? (' ' + name) : '');
};

utils.functionName = function(env) {
  return 'function' + (env.fn.name ? (' ' + env.fn.name) : '');
};

utils.pathName = function(env) {
  var fp = path.relative(utils.home(), env.path);
  return 'path ~/' + fp;
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

  // resolve `~` and `npm:` prefixes
  try {
    var fp = utils.resolveDir(name);
    fs.lstatSync(fp);
    return true;
  } catch (err) {}

  try {
    var globalFile = path.resolve(utils.gm, name);
    fs.lstatSync(globalFile);
    return true;
  } catch (err) {}

  try {
    var localFile = path.resolve('node_modules', name);
    fs.lstatSync(localFile);
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
  // local module by `name`
  try {
    return utils.resolveModule(name);
  } catch (err) {}

  // resolve `~` and `npm:` prefixes
  try {
    return utils.resolveModule(utils.resolveDir(name));
  } catch (err) {
    if (name.indexOf('npm:') === 0) {
      err.origin = __filename;
      throw err;
    }
  }

  // resolve globally installed modules
  try {
    return utils.resolveModule(path.resolve(utils.gm, name));
  } catch (err) {}

  // resolve local node_modules
  try {
    return utils.resolveModule(path.resolve('node_modules', name));
  } catch (err) {
    err.origin = __filename;
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

utils.alias = function(env, app) {
  var alias;
  env.define('alias', {
    configurable: true,
    enumerable: true,
    set: function(val) {
      alias = val;
    },
    get: function() {
      if (alias) return alias;
      var fn = app.options.toAlias
        || app.toAlias
        || env.instance.options.toAlias
        || env.instance.toAlias
        || env.toAlias
        || utils.identity;

      var name = path.basename(env.key);
      return alias || (alias = fn(name, env));
    }
  });
};

/**
 * Decorate a `namespace` method on `env`
 */

utils.namespace = function(env, app) {
  var namespace;

  Object.defineProperty(env, 'namespace', {
    configurable: true,
    enumerable: true,
    set: function(val) {
      namespace = val;
    },
    get: function() {
      if (namespace) return namespace;
      var alias = env.alias;
      var parent = env.parent || app;
      var ns = parent ? parent.namespace : '';
      if (ns && ns.slice(-alias.length) === alias) {
        return ns;
      }
      if (ns && ns !== 'base') {
        return ns + '.' + alias;
      }
      return alias;
    }
  });
};

/**
 * Expose `utils`
 */

module.exports = utils;
