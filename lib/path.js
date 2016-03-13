'use strict';

var fs = require('fs');
var path = require('path');
var extend = require('extend-shallow');
var resolve = require('resolve');
var invoke = require('./invoke');
var utils = require('./utils');

function EnvPath(name, env) {
  if (typeof env === 'string') {
    env = { path: env };
  }
  env = env || {};

  this.key = name;
  this.isEnv = true;
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

  this.define('stats', {
    set: function(val) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.stats.');
      }
      this._stats = val;
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.stats.');
      }
      return this._stats || (this._stats = fs.lstatSync(this.path));
    }
  });

  this.define('base', {
    set: function(val) {
      this._base = path.resolve(val || this.cwd);
    },
    get: function() {
      return this._base || (this._base = path.resolve(this._base || this.cwd));
    }
  });

  this.define('relative', {
    set: function() {
      throw new Error('env.relative is a getter created from env.base and env.path and cannot be set.');
    },
    get: function() {
      if (!this.base) {
        throw this.pathError('base', 'Cannot set env.relative.');
      }
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.relative.');
      }
      return path.relative(this.base, this.path);
    }
  });

  this.define('dirname', {
    set: function(dirname) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.dirname.');
      }
      this.path = path.join(dirname, path.basename(this.path));
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.dirname.');
      }
      return path.dirname(this.path);
    }
  });

  this.define('basename', {
    set: function(basename) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.basename.');
      }
      this.path = path.resolve(path.dirname(this.path), basename);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.basename.');
      }
      return path.basename(path.dirname(this.path));
    }
  });

  this.define('stem', {
    set: function(stem) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.stem.');
      }
      this.path = path.join(path.dirname(this.path), stem + this.extname);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.stem.');
      }
      return path.basename(this.path, this.extname);
    }
  });

  this.define('filename', {
    set: function(stem) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.filename.');
      }
      this.stem = stem;
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.filename.');
      }
      return this.stem;
    }
  });

  this.define('extname', {
    set: function(extname) {
      if (!this.path) {
        throw this.pathError('path', 'Cannot set env.extname.');
      }
      if (extname.charAt(0) !== '.') {
        extname = '.' + extname;
      }
      this.path = path.join(this.dirname, this.stem + extname);
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.extname.');
      }
      return path.extname(this.path);
    }
  });

  this.define('path', {
    set: function(fp) {
      if (typeof fp !== 'string') {
        throw this.pathError('path');
      }
      // track history when path changes
      if (fp && fp !== this.path) {
        this.history.push(resolve.sync(path.resolve(fp)));
      }
    },
    get: function() {
      var fp = this.history[this.history.length - 1];
      if (typeof fp !== 'string') {
        throw this.pathError('path');
      }
      return resolve.sync(path.resolve(fp));
    }
  });

  this.define('pkgPath', {
    set: function(fp) {
      throw new Error('env.pkgPath is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.pkgPath.');
      }
      return path.resolve(this.path, 'package.json');
    }
  });

  this.define('pkg', {
    set: function(fp) {
      throw new Error('env.pkg is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.pkg.');
      }
      if (utils.exists(this.pkgPath)) {
        return this._pkg || (this._pkg = require(this.pkgPath));
      }
      return {};
    }
  });

  this.define('alias', {
    set: function(alias) {
      this._alias = alias;
    },
    get: function() {
      if (this._alias) return this._alias;
      if (typeof this.aliasFn !== 'function') {
        throw new Error('expected env.aliasFn to be a function. cannot set env.alias');
      }
      return (this._alias = this.aliasFn(this.name, this));
    }
  });

  this.define('name', {
    set: function(name) {
      this._name = name;
    },
    get: function() {
      var name = this._name;
      if (name && utils.isAbsolute(name)) {
        return this.basename;
      }
      if (name) return name;
      if (this.dirname === process.cwd()) {
        return 'default';
      }
      return this.pkg && this.pkg.name || this.basename;
    }
  });

  this.define('main', {
    set: function(fp) {
      throw new Error('env.main is a getter and cannot be defined');
    },
    get: function() {
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.main.');
      }
      return this._main || (this._main = resolve.sync(this.path));
    }
  });

  this.define('fn', {
    set: function(fn) {
      this._fn = fn;
    },
    get: function() {
      if (this._fn) return this._fn;
      if (!this.path) {
        throw this.pathError('path', 'Cannot get env.fn.');
      }
      return (this._fn = require(this.main));
    }
  });

  this.history = (env.path ? [env.path] : env.history) || [];
  this.name = name;
  this.cwd = this.cwd || process.cwd();
}

EnvPath.prototype.inspect = function() {
  return '<Env "' + this.namespace + '" [path]>';
};

EnvPath.prototype.isMatch = function(str) {
  return this.key === str
    || this.name === str
    || this.alias === str
    || this.dirname === str
    || this.path === str
    || this.basename === str;
};

EnvPath.prototype.invoke = function(app, base, options) {
  return invoke(this, app, base, options);
};

EnvPath.prototype.pathError = function(prop, msg) {
  return new Error('expected env.' + prop + ' to be a string.' + (msg || ''));
};

EnvPath.prototype.isDirectory = function() {
  return this.stats && this.stats.isDirectory();
};

/**
 * Expose `EnvPath`
 */

module.exports = EnvPath;
