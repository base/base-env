'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var File = require('./file');

/**
 * Return true if `filepath` exists on the file system
 */

module.exports = function(file, options) {
  var opts = utils.extend({}, options);

  if (utils.isAbsolute(file.path)) {
    file = utils.resolve.file(file, function(file) {
      return resolvePath(file, options);
    });

  } else if (typeof opts.cwd === 'string') {
    file = utils.resolve.file(file, opts);

  } else if (utils.exists(file.path)) {
    file = utils.resolve.file(file, opts);

  } else if (utils.tryResolve(file.path)) {
    file.path = utils.tryResolve(file.path);
    file = utils.resolve.file(file);

  } else if (!utils.isAbsolute(file.path)) {
    opts.cwd = utils.gm;
    file = utils.resolve.file(file, opts);
  }

  return file;
};


function resolvePath(file, options) {
  file = new File(file);
  var opts = utils.extend({}, options, file.options);

  // do a quick check to see if `file.basename` has a dot. If not, then check to see
  // if `file.path` is a directory and if so attempt to resolve an actual file in
  // the directory
  if (file.isDirectory()) {
    var filepath = path.resolve(file.path, 'index.js');
    var basename = file.basename;

    if (!utils.exists(filepath) && file.pkg) {
      filepath = path.resolve(file.path, file.pkg.main);
    }

    if (utils.exists(filepath)) {
      file.folderName = basename;

      if (utils.isAbsolute(file.name)) {
        file.name = basename;
      }

      if (typeof file.options.toAlias === 'function') {
        file.alias = file.options.toAlias.call(file, file.name, file);
      }
      file.path = filepath;
      file.basename = path.basename(file.path);
      file.dirname = path.dirname(file.path);
    }
  }

  if (typeof opts.resolve === 'function') {
    // allow `file.path` to be updated or returned
    var res = opts.resolve(file);
    if (utils.isString(res)) {
      file.path = res;
    } else if (res) {
      file = res;
    }
  }
  return file;
};
