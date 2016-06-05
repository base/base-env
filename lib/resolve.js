'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');

/**
 * Return true if `filepath` exists on the file system
 */

module.exports = function(file, options) {
  var opts = utils.extend({}, options);

  if (utils.isAbsolute(file.path)) {
    utils.resolve.file(file, function(obj) {
      resolvePath(obj);
      return obj.path;
    });

  } else if (typeof opts.cwd === 'string') {
    file = utils.resolve.file(file, opts);

  } else if (utils.exists(file.path)) {
    file = utils.resolve.file(file, opts);

  } else if (!utils.isAbsolute(file.path)) {
    opts.cwd = utils.gm;
    file = utils.resolve.file(file, opts);
  }

  return file;
};


function resolvePath(file) {
  if (typeof file.stat === 'undefined') {
    file.stat = fs.lstatSync(file.path);
  }

  if (typeof file.isFile !== 'function') {
    file.isFile = function() {
      return file.stat.isFile();
    };
  }

  file.basename = path.basename(file.path);
  file.dirname = path.dirname(file.path);

  // do a quick check to see if `file.basename` has a dot. If not, then check to see
  // if `file.path` is a directory and if so attempt to resolve an actual file in
  // the directory
  if (!/\./.test(file.basename) && !file.isFile()) {
    var name = file.basename;
    var filepath = path.resolve(file.path, 'index.js');

    if (filepath && utils.exists(filepath)) {
      file.folderName = name;

      if (utils.isAbsolute(file.name)) {
        file.name = name;
      }

      if (typeof file.options.toAlias === 'function') {
        file.alias = file.options.toAlias.call(file, file.name, file);
      }
      file.path = filepath;
      file.main = filepath;
      file.basename = path.basename(file.path);
      file.dirname = path.dirname(file.path);
      file.stat = fs.lstatSync(file.path);
    }
  }

  if (typeof file.options.resolve === 'function') {
    // allow `file.path` to be updated or returned
    var filepath = file.options.resolve(file);
    if (utils.isString(filepath)) {
      file.path = filepath;
    }
  }
};
