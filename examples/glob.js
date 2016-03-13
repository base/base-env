'use strict';

var Base = require('base');
var path = require('path');
var extend = require('extend-shallow');
var plugins = require('base-plugins');
var resolve = require('resolve-up');
var hasGlob = require('has-glob');
var env = require('..');

Base.use(plugins());
Base.use(env());
Base.use(function(app) {
  app.generators = {};

  app.define('register', function(key, val, options) {
    var opts = extend({}, this.options, options);
    opts.aliasFn = this.toAlias.bind(this);
    opts.realpath = true;

    var env = this.createEnv(key, val, opts);
    this.generators[env.alias] = env;
    return this;
  });

  app.define('toAlias', function(name) {
    return name.replace(/^verb-([^-]+)-generator$/g, '$1');
  });

  app.define('tryRegister', function(key, val, options) {
    try {
      this.register(key, val, options);
    } catch (err) {
      console.log(err.stack);
    }
    return this;
  });

  app.define('registerGlob', function(pattern, options) {
    var opts = extend({}, options, {realpath: true});
    resolve(pattern, opts).forEach(function(fp) {
      // console.log(fp)
      opts.cwd = path.dirname(fp);
      this.tryRegister(fp, opts);
    }.bind(this));
  });
});

var base = new Base();

base.register('foo', function() {});
base.register('bar', new Base());
base.register('baz', 'npm:verb-readme-generator');
// base.registerGlob('verb-*-generator');

console.log(base);
