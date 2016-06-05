/*!
 * base-env <https://github.com/jonschlinkert/base-env>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var debug = require('debug')('base:base-env');
var resolve = require('./resolve');
var utils = require('./utils');
var File = require('./file');

/**
 * Create an instance of `Env` with the given `name`, `fn`, `app` instance, and options. The `Env` class
 * is used by [base-generators][] to handle some of the heavy lifting for resolving generators.
 *
 * ```js
 * var env = new Env('foo', function(app) {
 *   // do stuff to app
 * });
 * ```
 *
 * @param {String} `name`
 * @param {Function|Object|String} `fn` Function to be lazily invoked, instance, or filepath that resolves to one of the other types when required.
 * @param {Object} `app` Base instance to use for invocation context.
 * @param {Object} `options`
 * @api public
 */

function Env(name, fn, app, options) {
  var file = normalize({ name, app, options: options || {}}, fn);
  this.key = name;
  File.call(this, file);
  utils.extend(this, file);
  this.isEnv = true;
}

/**
 * Inherit `File`
 */

util.inherits(Env, File);

/**
 * Invoke `env.fn` with the given `context` and `options`.
 *
 * ```js
 * var app = new Base();
 * env.fn(app, {doStuff: true});
 * ```
 * @param {Object} `context` The application instance to use for invoking `env.fn`
 * @param {Object} `opptions`
 * @return {Object}
 * @api public
 */

Env.prototype.invoke = function(app, options) {
  debug('invoking "%s"', this.namespace);
  options = options || {};
  if (utils.isValidInstance(app)) {
    if (typeof app.parent === 'undefined') {
      app.parent = this.app;
    }
    this.app = app;
  } else {
    options = app;
    app = this.app;
  }

  // don't merge options onto created instances, only pass invoke options
  if (typeof this.fn === 'function') {
    var res = this.fn.call(app, app, app.base, this, options);
    if (utils.isValidInstance(res)) {
      this.app = res;
      return res;
    }
  }

  // merge `invoke` options onto existing instances
  if (this.type === 'app') {
    utils.extend(app.options, options);
  }
  return app;
};

/**
 * Returns true if the given `str` matches any of the following properties,
 * in order:
 *
 * - `env.key`
 * - `env.name`
 * - `env.alias`
 * - `env.dirname`
 * - `env.path`
 * - `env.basename`
 *
 * ```js
 * var env = new Env('foo', fucntion(){});
 * console.log(env.isMatch('bar')) //=> false
 * console.log(env.isMatch('foo')) //=> true
 * ```
 * @param {String} `str` The string to match
 * @return {Boolean} Retuns true if a match is made.
 * @api public
 */

Env.prototype.isMatch = function(name) {
  if (this.alias === name || this.name === name) {
    return true;
  }
  if (this.type !== 'path') {
    return false;
  }
  return this.stem === name
    || this.basename === name
    || this.path === name
    || this.dirname === name
    || this.folderName === name;
};

/**
 * Custom inspect function.
 */

Env.prototype.inspect = function() {
  var inspect = '';
  switch (this.type) {
    case 'app':
      inspect = utils.instanceName(this);
      break;
    case 'path':
      inspect = utils.pathName(this);
      break;
    case 'function':
    default: {
      inspect = utils.functionName(this);
      break;
    }
  }
  return `<Env "${this.name}" [${inspect}]>`;
};

/**
 * Getter that is set to `true` when the env being loaded is in the user's working directory.
 *
 * ```js
 * var env = new Env('generator.js', generatorFn, {cwd: process.cwd()});
 * console.log(env.isDefault);
 * //=> true
 * ```
 * @name .isDefault
 * @returns {Boolean}
 * @api public
 */

Object.defineProperty(Env.prototype, 'isDefault', {
  configurable: true,
  get: function() {
    if (typeof this._isDefault !== 'undefined') {
      return this._isDefault;
    }
    // the following condition adds support for defining a `default`
    // outside the current working directory. not sure if we want this or not
    if (this.key === 'default') {
      return (this._isDefault = true);
    }
    var isDefault = this.dirname === process.cwd() || utils.containsPath(process.cwd(), this.dirname);
    if (isDefault && utils.exists(path.resolve(this.cwd, this.key))) {
      this.alias = 'default';
      this.name = 'default';
      return (this._isDefault = true);
    }
    return (this._isDefault = false);
  }
});

/**
 * Getter for resolving the `namespace` of an `env`. A namespace is
 * created by joining the `namespace` from a parent instance (if exists)
 * to `env.alias` (e.g. `parent.namespace + '.' + env.alias`).
 *
 * ```js
 * var env = new Env('foo', function() {});
 *
 * @name .namespace
 * @returns {String}
 * @api public
 */

Object.defineProperty(Env.prototype, 'namespace', {
  configurable: true,
  get: function() {
    return this.app.namespace ? (this.app.namespace + '.' + this.alias) : this.alias;
  }
});

/**
 * Create a file object with normalized `fn`, `path` or `app` properties
 */

function normalize(file, fn) {
  var orig = utils.extend({}, file);

  // support paths
  if (typeof fn === 'string') {
    file.type = 'path';
    file.path = fn;
    file = resolve(file, file.options);

  // support functions
  } else if (typeof fn === 'function') {
    file.type = 'function';
    file.path = file.name;
    file.fn = fn;

  // support instances
  } else if (utils.isAppArg(file.app)) {
    file.type = 'app';
    file.path = file.name;
    file.app = fn;

  } else {
    throw new TypeError('expected env to be a string or function');
  }

  if (file === null) {
    throw new Error('cannot resolve: ' + util.inspect(orig.name));
  }
  return file;
}

/**
 * Expose `Env`
 */

module.exports = Env;
