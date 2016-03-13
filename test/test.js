'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var plugins = require('base-plugins');
var assert = require('assert');
var baseEnv = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('base-env error', function() {
  beforeEach(function() {
    base = new Base();
    base.registered = {};
    delete base.run;
  });

  it('should throw an error when base-plugins is not registered', function(cb) {
    try {
      base.use(baseEnv());
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected base-plugins to be registered');
      cb();
    }
  });
});

describe('base-env', function() {
  beforeEach(function() {
    Base.use(plugins());
    base = new Base();
  });

  describe('plugin', function() {
    it('should export a function', function() {
      assert.equal(typeof baseEnv, 'function');
    });

    it('should work as a plugin', function() {
      base.use(baseEnv());
      assert.equal(typeof base.createEnv, 'function');
    });

    it('should throw an error when a name is not passed', function(cb) {
      base.use(baseEnv());
      try {
        base.createEnv();
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'expected name to be a string');
        cb();
      }
    });

    it('should throw an error when invalid args are passed', function(cb) {
      base.use(baseEnv());
      try {
        base.createEnv('foo', 5);
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'cannot create env for "foo" from "5"');
        cb();
      }
    });

    it('should support instances', function() {
      base.use(baseEnv());
      var env = base.createEnv('foo', new Base());
      assert.equal(env.name, 'foo');
    });

    it('should support functions', function() {
      base.use(baseEnv());
      var env = base.createEnv('foo', function() {});
      assert.equal(env.name, 'foo');
    });

    it('should support paths', function() {
      base.use(baseEnv());
      var env = base.createEnv('foo', 'index.js');
      assert.equal(env.name, 'foo');
    });
  });
});
