'use strict';

var templates = require('templates');
var Base = require('base');
var path = require('path');
var extend = require('extend-shallow');
var plugins = require('base-plugins');
var env = require('..');

var base = new Base();
base.use(plugins());
base.use(env());
base.use(register({}));

function register(config) {
  return function(app) {
    this.generators = {};

    this.define('register', function(key, val, options) {
      var opts = extend({}, this.options, options);
      var env = this.createEnv(key, val, opts);
      this.generators[env.alias] = env;
      return this;
    });

    this.define('toAlias', function(name) {
      return name.replace(/^verb-([^-]+)-generator$/g, '$1');
    });
  };
}


base.register('foo', function() {});
base.register('bar', new Base());
base.register('baz', 'npm:verb-readme-generator');
// base.registerGlob('verb-*-generator');

console.log(base);
