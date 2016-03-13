'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var plugins = require('base-plugins');
var assert = require('assert');
var env = require('./');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('base-env', function() {
  beforeEach(function() {
    Base.use(plugins());
    base = new Base();
  });

  describe('plugin', function() {
    it('should export a function', function() {
      assert.equal(typeof env, 'function');
    });

    it('should work as a plugin', function() {
      base.use(env());
      assert.equal(typeof base.createEnv, 'function');
    });

    it('should throw an error when invalid args are passed', function(cb) {
      base.use(env());
      try {
        base.createEnv();
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'cannot create env for "undefined" from "undefined"');
        cb();
      }
    });
  });

  describe('instances', function() {
    beforeEach(function() {
      Base.use(plugins());
      base = new Base();
      base.use(env());
    });

    describe('createEnv', function() {
      it('should create an env object from an instance', function() {
        var env = base.createEnv('foo', new Base());
        assert(env);
      });
    });

    describe('env.app', function() {
      it('should add the instance to `env.app`', function() {
        var env = base.createEnv('foo', new Base());
        assert(env.app);
        assert.equal(typeof env.app, 'object');
        assert(env.app.hasOwnProperty('cache'));
        assert(env.app.hasOwnProperty('options'));
      });
    });

    describe('env.name', function() {
      it('should set the name on `env.name`', function() {
        var env = base.createEnv('foo-bar-baz', new Base());
        assert.equal(env.name, 'foo-bar-baz');
      });
    });

    describe('env.alias', function() {
      it('should set the alias on `env.alias`', function() {
        var env = base.createEnv('foo-bar-baz', new Base());
        assert.equal(env.alias, 'foo-bar-baz');
      });

      it('should support a custom alias function', function() {
        var env = base.createEnv('foo-bar-baz', new Base(), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.name, 'foo-bar-baz');
        assert.equal(env.alias, 'foo');
      });
    });

    describe('env.invoke', function() {
      it('should return the cached instance when `invoke` is called (noop)', function() {
        var env = base.createEnv('foo-bar-baz', new Base());
        assert.deepEqual(env.invoke(), env.app);
      });
    });

    describe('env.isMatch', function() {
      it('should return true when val matches env.name', function() {
        var env = base.createEnv('foo-bar-baz', new Base());
        assert.equal(env.isMatch('foo-bar-baz'), true);
      });

      it('should return true when val matches env.alias', function() {
        var env = base.createEnv('foo-bar-baz', new Base(), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('foo'), true);
      });

      it('should return false when val does not match', function() {
        var env = base.createEnv('foo-bar-baz', new Base(), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('bar'), false);
      });
    });
  });

  describe('filepaths', function() {
    beforeEach(function() {
      Base.use(plugins());
      base = new Base();
      base.use(env());
    });

    describe('createEnv', function() {
      it('should create an env object from a filepath', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert(env);
      });

      it('should create an env object from a filepath when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert(env);
      });
    });

    describe('env.path', function() {
      it('should set env.path', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert(env.path);
      });

      it('should set the absolute path on `env.path`', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert(env.path);
        assert.equal(typeof env.path, 'string');
        assert.equal(env.path, fixtures('verb-readme-generator/index.js'));
      });

      it('should set the absolute path on `env.path` when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert(env.path);
        assert.equal(typeof env.path, 'string');
        assert.equal(env.path, fixtures('verb-readme-generator/index.js'));
      });
    });

    describe('env.basename', function() {
      it('should set env.basename', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert(env.basename);
      });

      it('should set the basename on `env.basename`', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert(env.basename);
        assert.equal(env.basename, 'verb-readme-generator');
      });

      it('should set the basename on `env.basename` when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert(env.basename);
        assert.equal(env.basename, 'verb-readme-generator');
      });
    });

    describe('env.name', function() {
      it('should set the name on `env.name`', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'));
        assert.equal(env.name, 'readme');
      });

      it('should set the name on `env.name` when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert.equal(env.name, 'verb-readme-generator');
      });
    });

    describe('env.stem', function() {
      it('should set the stem on `env.stem`', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert.equal(env.stem, 'index');
      });
    });

    describe('env.filename', function() {
      it('should set the filename on `env.filename`', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert.equal(env.filename, 'index');
      });
    });

    describe('env.alias', function() {
      it('should set the alias on `env.alias`', function() {
        var env = base.createEnv('foo', fixtures('verb-readme-generator'));
        assert.equal(env.alias, 'foo');
      });

      it('should set the alias on `env.alias` when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'));
        assert.equal(env.alias, 'verb-readme-generator');
      });

      it('should support a custom alias function', function() {
        var env = base.createEnv('verb-readme-generator', fixtures('verb-readme-generator'), {
          aliasFn: function(name) {
            return name.replace(/^verb-(.*?)-generator/, '$1');
          }
        });
        assert.equal(env.name, 'verb-readme-generator');
        assert.equal(env.alias, 'readme');
      });

      it('should support a custom alias function when one arg is passed', function() {
        var env = base.createEnv(fixtures('verb-readme-generator'), {
          aliasFn: function(name) {
            return name.replace(/^verb-(.*?)-generator/, '$1');
          }
        });
        assert.equal(env.name, 'verb-readme-generator');
        assert.equal(env.alias, 'readme');
      });
    });

    describe('env.fn', function() {
      it('should add a function from `env.path`', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'));
        assert(env.fn);
        assert.equal(typeof env.fn, 'function');
      });
    });

    describe('env.invoke', function() {
      it('should invoke a function with the given context', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'));
        var app = new Base();
        assert.deepEqual(env.invoke(app, app.base), env.app);
      });

      it('should return the cached instance when `invoke` is called', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'));
        var app = new Base();
        assert.deepEqual(env.invoke(app, app.base), env.app);
      });
    });

    describe('env.isMatch', function() {
      it('should return true when val matches env.name', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'));
        assert.equal(env.isMatch('readme'), true);
        assert.equal(env.isMatch('verb-readme-generator'), true);
      });

      it('should return true when val matches env.alias', function() {
        var env = base.createEnv('readme', fixtures('verb-readme-generator'), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('verb-readme-generator'), true);
        assert.equal(env.isMatch('foo'), true);
      });

      it('should return false when val does not match', function() {
        var env = base.createEnv('foo-bar-baz', new Base(), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('bar'), false);
      });
    });
  });

  describe('functions', function() {
    beforeEach(function() {
      Base.use(plugins());
      base = new Base();
      base.use(env());
    });

    describe('createEnv', function() {
      it('should create an env object from a function', function() {
        var env = base.createEnv('foo', function() {});
        assert(env);
      });

      it('should throw an error when only a function is passed', function(cb) {
        try {
          base.createEnv(function() {});
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'expected name to be a string');
          cb();
        }
      });
    });

    describe('env.name', function() {
      it('should set the name on `env.name`', function() {
        var env = base.createEnv('verb-readme-generator', function() {});
        assert.equal(env.name, 'verb-readme-generator');
      });
    });

    describe('env.alias', function() {
      it('should set the alias on `env.alias`', function() {
        var env = base.createEnv('verb-readme-generator', function() {});
        assert.equal(env.alias, 'verb-readme-generator');
        assert.equal(env.name, 'verb-readme-generator');
      });

      it('should support a custom alias function', function() {
        var env = base.createEnv('verb-readme-generator', fixtures('verb-readme-generator'), {
          aliasFn: function(name) {
            return name.replace(/^verb-(.*?)-generator/, '$1');
          }
        });
        assert.equal(env.alias, 'readme');
        assert.equal(env.name, 'verb-readme-generator');
      });
    });

    describe('env.fn', function() {
      it('should add a function to `env.fn`', function() {
        var env = base.createEnv('readme', function() {});
        assert(env.fn);
        assert.equal(typeof env.fn, 'function');
      });
    });

    describe('env.invoke', function() {
      it('should invoke a function with the given context', function() {
        var env = base.createEnv('readme', function() {});
        var app = new Base();
        assert.deepEqual(env.invoke(app, app.base), env.app);
      });

      it('should return the cached instance when `invoke` is called', function() {
        var env = base.createEnv('readme', function() {});
        var app = new Base();
        assert.deepEqual(env.invoke(app, app.base), env.app);
      });
    });

    describe('env.isMatch', function() {
      it('should return true when val matches env.name', function() {
        var env = base.createEnv('verb-readme-generator', function() {});
        assert.equal(env.isMatch('verb-readme-generator'), true);
      });

      it('should return true when val matches env.alias', function() {
        var env = base.createEnv('verb-readme-generator', function() {}, {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('verb-readme-generator'), true);
        assert.equal(env.isMatch('foo'), true);
      });

      it('should return false when val does not match', function() {
        var env = base.createEnv('foo-bar-baz', new Base(), {
          aliasFn: function() {
            return 'foo';
          }
        });
        assert.equal(env.isMatch('bar'), false);
      });
    });
  });
});
