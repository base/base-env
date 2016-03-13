'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var plugins = require('base-plugins');
var gm = require('global-modules');
var assert = require('assert');
var baseEnv = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('filepaths', function() {
  beforeEach(function() {
    Base.use(plugins());
    Base.use(baseEnv());
    base = new Base();
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

    it('should support options as the last argument', function() {
      var env = base.createEnv('foo', 'index.js', {foo: 'bar'});
      assert(env);
      assert.equal(env.foo, 'bar');
    });

    it('should support options as the second argument', function() {
      var env = base.createEnv('foo', {foo: 'bar'}, 'index.js');
      assert(env);
      assert.equal(env.foo, 'bar');
    });
  });

  describe('env.inspect', function() {
    it('should expose an inspect method', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.inspect);
      assert.equal(typeof env.inspect, 'function');
    });

    it('should show [path] when env is created from a path', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(/<Env "foo" \[path\]>/.test(env.inspect()));
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

    it('should invoke an instance', function() {
      var env = base.createEnv('readme', fixtures('instance'));
      var app = new Base();
      env.invoke(app);
      assert.deepEqual(env.invoke(app, app.base), env.app);
    });
  });

  describe('env.stat', function() {
    it('should expose a stat object', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.stat);
      assert.equal(typeof env.stat, 'object');
    });
  });

  describe('env.base', function() {
    it('should expose env.base', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.base);
    });

    it('should set env.base', function() {
      var env = base.createEnv('foo', 'verb-readme-generator', {base: fixtures()});
      assert(env.base);
    });
  });

  describe('env.namespace', function() {
    it('should expose a namespace property', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.namespace);
      assert.equal(typeof env.namespace, 'string');
    });

    it('should set env.name to env.namespace', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert.equal(env.namespace, 'foo');
    });

    it('should set a custom namespace', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      env.namespace = 'bar';
      assert.equal(env.namespace, 'bar');
    });

    it('should prefix env.namespace with parent.namespace', function() {
      var app = new Base();
      app.namespace = 'abc';

      var env = base.createEnv('foo', fixtures('verb-readme-generator'), {parent: app});
      assert.equal(env.namespace, 'abc.foo');
    });
  });

  describe('env.name', function() {
    it('should set the name on `env.name`', function() {
      var env = base.createEnv('readme', fixtures('verb-readme-generator'));
      assert.equal(env.name, 'readme');
    });

    it('should udpate env.name', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      env.name = 'foo';
      assert.equal(env.name, 'foo');
    });

    it('should set the name on `env.name` when one arg is passed', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert.equal(env.name, 'verb-readme-generator');
    });

    it('should get `name` from package.json if the file exists', function() {
      var env = base.createEnv(fixtures('generate-node'));
      assert.equal(env.name, 'foo-bar-baz');
    });
  });

  describe('env.isDefault', function() {
    it('should set isDefault to true when path.dirname === env.cwd', function() {
      var env = base.createEnv('index.js');
      assert.equal(env.isDefault, true);
    });

    it('should set isDefault to false when a name is passed', function() {
      var env = base.createEnv('foo', 'index.js');
      assert.equal(env.isDefault, false);
    });

    it('should set name to default when isDefault is true', function() {
      var env = base.createEnv('index.js');
      assert.equal(env.name, 'default');
    });

    it('should not set name to default when an explicit name is passed', function() {
      var env = base.createEnv('foo', 'index.js');
      assert.equal(env.name, 'foo');
    });
  });

  describe('env.path', function() {
    it('should expose env.path', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.path);
    });

    it('should set the absolute path on `env.path`', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.path);
      assert.equal(typeof env.path, 'string');
      assert.equal(env.path, fixtures('verb-readme-generator/index.js'));
    });

    it('should update env.path', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      env.path = 'abc';
      assert.equal(env.path, 'abc');
    });

    it('should set the absolute path on `env.path` when one arg is passed', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert(env.path);
      assert.equal(typeof env.path, 'string');
      assert.equal(env.path, fixtures('verb-readme-generator/index.js'));
    });

    it('should resolve a module from global npm modules', function() {
      var env = base.createEnv('npm:verb-readme-generator');
      assert(env.path);
      assert.equal(env.path, path.resolve(gm, 'verb-readme-generator/index.js'));
    });

    it('should not set `env.path` when path does not exist', function() {
      var env = base.createEnv('npm:dfosfjsslkslkfr');
      assert.equal(typeof env.path, 'undefined');
    });
  });

  describe('env.relative', function() {
    it('should expose env.relative', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.relative);
    });
  });

  describe('env.dirname', function() {
    it('should expose env.dirname', function() {
      var env = base.createEnv('foo', fixtures('verb-readme-generator'));
      assert(env.dirname);
      assert.equal(path.dirname(fixtures('verb-readme-generator/index.js')), env.dirname);
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

  describe('env.stem', function() {
    it('should set the stem on `env.stem`', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert.equal(env.stem, 'index');
    });
  });

  describe('env.filename', function() {
    it('should expose `env.filename`', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert.equal(env.filename, 'index');
    });
  });

  describe('env.pkgPath', function() {
    it('should expose `env.pkgPath`', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert.equal(env.pkgPath, fixtures('verb-readme-generator/package.json'));
    });
  });

  describe('env.pkg', function() {
    it('should expose `env.pkg`', function() {
      var env = base.createEnv('index.js');
      assert.equal(env.pkg.name, 'base-env');
    });

    it('should return an empty object when package.json does not exist', function() {
      var env = base.createEnv(fixtures('verb-readme-generator'));
      assert.deepEqual(env.pkg, {});
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
