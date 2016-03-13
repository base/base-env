'use strict';

var isAbsolute = require('is-absolute');
var define = require('define-property');
var fs = require('fs');

exports.isAbsolute = isAbsolute;

exports.exists = function(fp) {
  try {
    fs.lstatSync(fp);
    return true;
  } catch (err) {};
  return false;
};

exports.aliasFn = function(env) {
  if (typeof env.aliasFn !== 'function') {
    env.aliasFn = function(name, file) {
      if (isAbsolute(name)) {
        return file.basename;
      }
      return name;
    };
  }
};

exports.define = function(env) {
  define(env, 'define', function(prop, val) {
    var key = '_' + prop;
    define(this, key, this[key] || null);
    define(this, prop, val);
  });
};

exports.namespace = function(env) {
  Object.defineProperty(env, 'namespace', {
    get: function() {
      var namespace = (this.parent && this.parent.namespace) || '';
      if (namespace) {
        namespace += '.';
      }
      return namespace + this.alias;
    }
  });
};
