'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var resolve = require('./resolve');

/**
 * This is based on https://github.com/gulpjs/vinyl, but with a ton of
 * changes, since we don't need to clone or use streams or contents.
 * We only need getters/setters for paths.
 */

function File(file, options) {
  file = file || {};
  this.file = file;
  this.options = file.options || options || {};

  // Record path change
  var history = file.path ? [file.path] : file.history;
  this.history = history || [];

  this.cwd = file.cwd || process.cwd();
  this.base = file.base || this.cwd;

  // Stat = files stats object
  this.stat = file.stat || null;
  this._isFile = true;
}

File.prototype.inspect = function() {
  var inspect = [];
  var filepath = (this.base && this.path) ? this.relative : this.path;
  if (filepath) {
    inspect.push('"' + filepath + '"');
  }
  return '<File ' + inspect.join(' ') + '>';
};

File.prototype.isFile = function() {
  return this.stat && this.stat.isFile();
};

File.prototype.isDirectory = function() {
  return this.stat && this.stat.isDirectory();
};

Object.defineProperty(File.prototype, 'stat', {
  configurable: true,
  set: function(stat) {
    this._stat = stat;
  },
  get: function() {
    if (typeof this._stat !== 'undefined') {
      return this._stat;
    }
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.stat');
    }
    if (utils.exists(this.path)) {
      this._stat = fs.lstatSync(this.path);
      return this._stat;
    }
    return (this._stat = null);
  }
});

Object.defineProperty(File.prototype, 'relative', {
  configurable: true,
  set: function() {
    throw new Error('file.relative is generated from file.base and file.path and cannot be modified');
  },
  get: function() {
    if (!this.base) {
      throw new Error('expected file.base to be a string, cannot get file.relative');
    }
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.relative');
    }
    return path.relative(this.base, this.path);
  }
});

Object.defineProperty(File.prototype, 'dirname', {
  configurable: true,
  set: function(dirname) {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot set file.dirname');
    }
    this.path = path.join(dirname, path.basename(this.path));
  },
  get: function() {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.dirname');
    }
    return path.dirname(this.path);
  }
});

Object.defineProperty(File.prototype, 'basename', {
  configurable: true,
  set: function(basename) {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot set file.basename');
    }
    this.path = path.join(path.dirname(this.path), basename);
  },
  get: function() {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.basename');
    }
    return path.basename(this.path);
  }
});

Object.defineProperty(File.prototype, 'stem', {
  configurable: true,
  set: function(stem) {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot set file.stem');
    }
    this.path = path.join(path.dirname(this.path), stem + this.extname);
  },
  get: function() {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.stem');
    }
    return path.basename(this.path, this.extname);
  }
});

Object.defineProperty(File.prototype, 'extname', {
  configurable: true,
  set: function(extname) {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot set file.extname');
    }
    this.path = path.join(this.dirname, this.stem + extname);
  },
  get: function() {
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.extname');
    }
    return path.extname(this.path);
  }
});

Object.defineProperty(File.prototype, 'path', {
  configurable: true,
  set: function(filepath) {
    if (typeof filepath !== 'string') {
      throw new Error('expected file.path to be a string');
    }
    if (filepath && filepath !== this.path) {
      this.history.push(filepath);
    }
  },
  get: function() {
     return this.history[this.history.length - 1];
  }
});

Object.defineProperty(File.prototype, 'name', {
  configurable: true,
  set: function(name) {
    this._name = name;
  },
  get: function() {
    if (this.isDefault === true) {
      return 'default';
    }
    if (typeof this.options.renameKey === 'function') {
      this._name = this.options.renameKey.call(this, this._name);
    }
    if (utils.isString(this.pkg.name) && utils.exists(path.resolve(this.cwd, this.key))) {
      this._name = this.pkg.name;
      return this._name;
    }
    if (utils.isString(this._name)) {
      return this._name;
    }
    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.stat');
    }
    return this._name;
  }
});

Object.defineProperty(File.prototype, 'alias', {
  configurable: true,
  set: function(alias) {
    this._alias = alias;
  },
  get: function() {
    if (utils.isString(this._alias)) {
      return this._alias;
    }
    if (!this.name) {
      throw new Error('expected file.name to be a string, cannot get file.alias');
    }
    if (typeof this.options.toAlias === 'function') {
      return (this._alias = this.options.toAlias.call(this, this.name, this));
    }
    return (this._alias = this.name);
  }
});

Object.defineProperty(File.prototype, 'fn', {
  configurable: true,
  set: function(fn) {
    this._fn = fn;
  },
  get: function() {
    if (typeof this._fn === 'function') {
      return this._fn;
    }

    if (!this.path) {
      throw new Error('expected file.path to be a string, cannot get file.fn');
    }

    if (this.type === 'app') {
      return this.app;
    }

    var fn = require(this.path);
    if (typeof fn === 'function') {
      this._fn = fn;
      return fn;
    }

    if (utils.isValidInstance(fn)) {
      return function() {
        return fn;
      };
    }

    throw new Error('expected file.path to export a function or instance');
  }
});

Object.defineProperty(File.prototype, 'app', {
  configurable: true,
  set: function(app) {
    this._app = app;
  },
  get: function() {
    var app = this._app || this.file.app;
    if (utils.isValidInstance(app)) {
      return (this._app = app);
    }
    return null;
  }
});

Object.defineProperty(File.prototype, 'pkgPath', {
  configurable: true,
  set: function(pkg) {
    this._pkgPath = pkg;
  },
  get: function() {
    if (utils.isString(this._pkgPath)) {
      return this._pkgPath;
    }

    var app = this.app || {};
    if (utils.isObject(app.pkg) && utils.isString(app.pkg.path)) {
      return app.pkg.path;
    }

    var cwd = this.isFile() ? this.dirname : this.path;
    var pkgPath = path.resolve(cwd, 'package.json');
    if (utils.exists(pkgPath)) {
      return pkgPath;
    }
    return null;
  }
});


Object.defineProperty(File.prototype, 'pkg', {
  configurable: true,
  set: function(pkg) {
    this._pkg = pkg;
  },
  get: function() {
    if (utils.isObject(this._pkg) && utils.isString(this._pkg.name)) {
      return this._pkg;
    }

    var app = this.app || {};
    if (utils.isObject(app.pkg) && typeof app.pkg.get === 'function') {
      return this.app.pkg.data;
    }

    var cwd = this.isFile() ? this.dirname : this.path;
    if (this.pkgPath) {
      return (this._pkg = require(this.pkgPath));
    }
    return {};
  }
});

/**
 * Static methods
 */

File.isFile = function(file) {
  return utils.typeOf(file) === 'object' && file._isFile === true;
};

/**
 * Expose `File`
 */

module.exports = File;
