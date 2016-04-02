'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('base:base-env:path');
var invoke = require('./invoke');
var utils = require('./utils');

function EnvPath(name, env, app) {
  debug('creating env for "%s"', name);

  this.instance = app;
  this.isEnv = true;
  this.key = name;

  // decorate methods
  utils.define(this);
  utils.alias(this);
  utils.namespace(this);

  this.define('stat', {
    get: function() {
      return this._stat || (this._stat = fs.lstatSync(this.path));
    }
  });

  this.define('isAbsolute', {
    get: function() {
      return utils.isAbsolute(name);
    }
  });

  this.define('isDefault', {
    get: function() {
      if (this._isDefault) return true;
      var cwd = app.cwd || process.cwd();
      var is = this.dirname === cwd && name === env.path;
      return (this._isDefault = is);
    }
  });

  this.define('name', {
    set: function(name) {
      this._name = name;
    },
    get: function() {
      if (this._name) {
        return this._name;
      }
      if (this.isDefault) {
        return 'default';
      }
      var isPath = env.isPath || this.isAbsolute;
      if (isPath) {
        return this.pkg && this.pkg.name || this.basename;
      }
      return (this._name = name);
    }
  });

  this.define('path', {
    set: function(name) {
      this._path = name;
    },
    get: function() {
      return this._path || (this._path = utils.tryResolve(env.path));
    }
  });

  this.define('relative', {
    get: function() {
      return path.relative(this.base, this.path);
    }
  });

  this.define('dirname', {
    get: function() {
      return path.dirname(this.path);
    }
  });

  this.define('basename', {
    get: function() {
      return path.basename(path.dirname(this.path));
    }
  });

  this.define('stem', {
    get: function() {
      return path.basename(this.path, this.extname);
    }
  });

  this.define('filename', {
    get: function() {
      return this.stem;
    }
  });

  this.define('extname', {
    get: function() {
      return path.extname(this.path);
    }
  });

  this.define('pkgPath', {
    get: function() {
      return path.resolve(this.dirname, 'package.json');
    }
  });

  this.define('pkg', {
    get: function() {
      if (utils.exists(this.pkgPath)) {
        return this._pkg || (this._pkg = require(this.pkgPath));
      }
      return {};
    }
  });

  this.define('main', {
    get: function() {
      return this._main || (this._main = utils.resolve.sync(this.path));
    }
  });

  this.define('app', {
    set: function(app) {
      this._app = app;
    },
    get: function() {
      if (this._app) return this._app;
      var app = require(this.main);
      if (typeof app === 'function') {
        this._fn = app;
        return null;
      }
      return (this._app = app);
    }
  });

  this.define('fn', {
    get: function() {
      var fn = this._fn || (this._fn = require(this.main));
      if (utils.isObject(fn)) {
        if (!fn.isBase) {
          throw new Error('expected a function or instance to be exported');
        }
        // since `fn` is an instance, update `env.instance` to be `fn`
        var app = this.app = this.instance = fn;
        fn = function() {
          return app;
        };
      }
      return fn;
    }
  });

  if (env.base && env.path) {
    env.path = path.join(env.base, env.path);
  }

  env.cwd = env.cwd || process.cwd();
  env.base = env.base || env.cwd;

  for (var key in env) {
    if (key !== 'path' && key !== 'name') {
      this[key] = env[key];
    }
  }
}

/**
 * Custom inspect function.
 */

EnvPath.prototype.inspect = function() {
  return '<Env "' + this.namespace + '" [path]>';
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
 * @param {String} `str` The string to match
 * @return {Boolean} Retuns true if a match is made.
 */

EnvPath.prototype.isMatch = function(str) {
  return this.key === str
    || this.name === str
    || this.alias === str
    || this.dirname === str
    || this.path === str
    || this.basename === str;
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

EnvPath.prototype.invoke = function(app, options) {
  return invoke(this, app, options);
};

/**
 * Expose `EnvPath`
 */

module.exports = EnvPath;
