'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var plugins = require('base-plugins');
var assert = require('assert');
var env = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('functions', function() {
  beforeEach(function() {
    Base.use(function fn() {
      this.isApp = true;
      return fn;
    });
    Base.use(plugins());
    Base.use(env());
    base = new Base();
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

    it('should support options as the last argument', function() {
      var env = base.createEnv('foo', function sllsls() {}, {foo: 'bar'});
      assert(env);
      assert.equal(env.options.foo, 'bar');
    });

    it('should support options as the second argument', function() {
      var env = base.createEnv('foo', {foo: 'bar'}, function() {});
      assert(env);
      assert.equal(env.options.foo, 'bar');
    });
  });

  describe('env.invoke', function() {
    it('should throw an error when invoked with `app` and env.fn is not a function', function(cb) {
      try {
        var env = base.createEnv(fixtures('not-exported'));
        var app = new Base();
        env.invoke(app);
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'expected file.path to export a function or instance');
        cb();
      }
    });

    it('should throw an error when invoked and env.fn is not a function', function(cb) {
      try {
        var env = base.createEnv(fixtures('not-exported'));
        env.invoke();
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'expected file.path to export a function or instance');
        cb();
      }
    });

    it('should expose exported instances on env.app', function() {
      var env = base.createEnv('instance', fixtures('instance'));
      assert.deepEqual(env.app, base);
      assert.notDeepEqual(env.app, require(fixtures('instance')));
      env.invoke();
      assert.deepEqual(env.app, require(fixtures('instance')));
    });

    it('should invoke a function with the given instance', function() {
      var env = base.createEnv('readme', function() {});
      var app = new Base();
      app.parent = base;
      assert.deepEqual(env.invoke(app), env.app);
    });
  
    it('should return the cached instance when `invoke` is called', function() {
      var env = base.createEnv('readme', function() {});
      var app = new Base();
      assert.deepEqual(env.invoke(app), env.app);
    });

    it('should merge options onto the invoked instance', function() {
      base.foo = 'bar';
      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.equal(options.c, 'd');
      });
      env.invoke({c: 'd'});
      assert.equal(env.app.foo, 'bar');
    });

    it('should update the base instance', function() {
      var env = base.createEnv('foo-bar-baz', function(app, first, env, options) {
        first.foo = 'bar';
      });
      env.invoke();
      assert.equal(env.app.base.foo, 'bar');
    });

    it('should merge options onto the invoked instance when an app is passed', function() {
      var foo = new Base();
      foo.options.a = 'b';

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.equal(typeof options.a, 'undefined');
        assert.equal(app.options.a, 'b');
        assert.equal(options.c, 'd');
      });
      env.invoke(foo, {c: 'd'});
    });

    it('should not merge options onto the app instance from the env instance', function() {
      var foo = new Base();
      foo.options.a = 'b';

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.equal(typeof options.a, 'undefined');
        assert.equal(options.c, 'd');
      });

      assert.equal(typeof foo.options.c, 'undefined');
      assert.equal(foo.options.a, 'b');
      env.invoke(foo, {c: 'd'});

      assert.equal(foo.options.a, 'b');
      assert.equal(typeof foo.options.c, 'undefined');
    });

    it('should expose the given instance as `app` to the invoked function', function() {
      var foo = new Base();

      var env = base.createEnv('foo', function(app) {
        app.x = 'z';
      });

      env.invoke(foo);
      assert.equal(foo.x, 'z');
    });

    it('should expose the first instance as `base` to the invoked function', function() {
      var foo = new Base();
      foo.parent = base;
      var count = 0;

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        base.x = 'z';
        count++;
      });

      env.invoke(foo, {c: 'd'});
      assert.equal(count, 1);
      assert.equal(base.x, 'z');
    });

    it('should expose env as the third argument', function() {
      var foo = new Base();
      base.one = 'two';

      var env = base.createEnv('foo-bar-baz', function(app, base, env) {
        env.x = 'z';
      });

      env.invoke(foo, {c: 'd'});
      assert.equal(env.x, 'z');
    });

    it('should expose options as the fourth argument', function() {
      var foo = new Base();
      base.one = 'two';

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        options.x = 'z';
      });

      var opts = {};
      env.invoke(foo, opts);
      assert.equal(opts.x, 'z');
    });

    it('should expose the same base instance as app.base', function(cb) {
      var foo = new Base();
      foo.a = 'a';
      var bar = new Base();
      bar.b = 'b';
      bar.parent = foo;
      var baz = new Base();
      baz.c = 'c';
      baz.parent = bar;

      var count = 0;

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.deepEqual(app.base, base);
        count++;
      });

      env.invoke(baz);
      assert.equal(count, 1);
      cb();
    });

    it('should expose app as `this`', function(cb) {
      var foo = new Base();
      foo.a = 'a';
      var bar = new Base();
      bar.b = 'b';
      bar.parent = foo;
      var baz = new Base();
      baz.c = 'c';
      baz.parent = bar;

      var count = 0;

      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.deepEqual(app, this);
        count++;
      });

      env.invoke(baz);
      assert.equal(count, 1);
      cb();
    });

    it('should expose namespace on app', function() {
      var foo = new Base();
      foo.is('foo');
      foo.a = 'a';
      var bar = new Base();
      bar.is('bar');
      bar.b = 'b';
      bar.parent = foo;
      var baz = new Base();
      baz.is('baz');
      baz.c = 'c';
      baz.parent = bar;

      var count = 0;

      var env = base.createEnv('whatever', function(app, base, env, options) {
        assert.equal(app.namespace, 'foo.bar.baz');
        assert.equal(env.namespace, 'foo.bar.baz.whatever');
        count++;
      });

      env.invoke(baz);
      assert.equal(count, 1);
    });

    it('should expose `env.namespace`', function() {
      var foo = new Base();
      foo.is('foo');
      foo.a = 'a';
      var bar = new Base();
      bar.is('bar');
      bar.b = 'b';
      bar.parent = foo;
      var baz = new Base();
      baz.is('baz');
      baz.c = 'c';
      baz.parent = bar;

      var count = 0;

      var env = base.createEnv('whatever', function(app, base, env, options) {
        assert.equal(app.namespace, 'foo.bar.baz');
        assert.equal(env.namespace, 'foo.bar.baz.whatever');
        count++;
      });

      env.invoke(baz);
      assert.equal(count, 1);
    });

    it('should expose `app.namespace` on the instance', function() {
      var foo = new Base();
      foo.is('foo');
      foo.a = 'a';
      var bar = new Base();
      bar.is('bar');
      bar.b = 'b';
      bar.parent = foo;
      var baz = new Base();
      baz.is('baz');
      baz.c = 'c';
      baz.parent = bar;

      var count = 0;

      var env = base.createEnv('last', function(app, base, env, options) {
        assert.equal(this.namespace, 'foo.bar.baz');
        assert.equal(env.namespace, 'foo.bar.baz.last');
        count++;
      });

      env.invoke(baz);
      assert.equal(env.namespace, 'foo.bar.baz.last');

      assert.equal(count, 1);
    });

    it('should expose namespace on env', function() {
      var foo = new Base();
      foo.a = 'a';
      assert.equal(foo.namespace, 'base');
      
      var bar = new Base();
      bar.b = 'b';
      bar.parent = foo;
      assert.equal(bar.namespace, 'base.base');

      var baz = new Base();
      baz.c = 'c';
      baz.parent = bar;
      assert.equal(baz.namespace, 'base.base.base');

      var count = 0;
      var env = base.createEnv('foo-bar-baz', function(app, base, env, options) {
        assert.equal(app.namespace, 'base.base.base');
        assert.equal(env.namespace, 'base.base.base.foo-bar-baz');
        count++;
      });

      env.invoke(baz);
      assert.equal(count, 1);
    });

    it('should create namespace from parent namespaces', function() {
      var foo = new Base();
      foo._n = 'foo';
      foo.alias = 'foo';
      assert.equal(foo.namespace, 'foo');

      var bar = new Base();
      bar._n = 'bar';
      bar.alias = 'bar';
      bar.parent = foo;
      assert.equal(bar.namespace, 'foo.bar');

      var baz = new Base();
      baz._n = 'baz';
      baz.alias = 'baz';
      baz.parent = bar;
      assert.equal(baz.namespace, 'foo.bar.baz');

      var qux = new Base();
      qux.alias = 'qux';
      assert.equal(qux.namespace, 'qux');
      var count = 0;

      function generator(name) {
        return function(app, base, env, options) {
          // base namespace
          assert.equal(base.namespace, 'foo');
          assert.equal(this.base.namespace, 'foo');
          // app namespace
          assert.equal(app.namespace, 'foo.bar.baz');
          assert.equal(this.namespace, 'foo.bar.baz');

          // env namespace (app.namespace + env.alias)
          assert.equal(env.alias, name);
          assert.equal(env.namespace, 'foo.bar.baz.' + name);
          count++;
        };
      }

      var aaa = qux.createEnv('aaa', generator('aaa'));
      var bbb = qux.createEnv('bbb', generator('bbb'));
      var ccc = qux.createEnv('ccc', generator('ccc'));

      aaa.invoke(baz);
      assert.equal(qux.namespace, 'qux');
      bbb.invoke(baz);
      assert.equal(qux.namespace, 'qux');
      ccc.invoke(baz);
      assert.equal(qux.namespace, 'qux');
      assert.equal(count, 3);
    });
  });

  describe('env.inspect', function() {
    it('should expose an inspect method', function() {
      var env = base.createEnv('foo', function() {});
      assert(env.inspect);
      assert.equal(typeof env.inspect, 'function');
    });

    it('should display [function] when env is created from a function', function() {
      var env = base.createEnv('foo', function() {});
      assert.equal(env.inspect(), '<Env "foo" [function]>');
    });

    it('should display the function name when env function has a name', function() {
      var env = base.createEnv('foo', function whatever() {});
      assert.equal(env.inspect(), '<Env "foo" [function whatever]>');
    });
  });

  describe('env.app', function() {
    it('should expose env.app after `env.invoke` is called', function() {
      var env = base.createEnv('foo', function() {});
      env.invoke();
      assert.equal(env.app.isApp, true);
    });
  });

  describe('env.namespace', function() {
    it('should expose a namespace property', function() {
      var env = base.createEnv('foo', function() {});
      assert.equal(env.namespace, 'base.foo');
    });

    it('should set env.name to env.namespace', function() {
      var env = base.createEnv('foo', function() {});
      assert.equal(env.namespace, 'base.foo');
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

    it('should work as a setter', function() {
      var env = base.createEnv('verb-readme-generator', function() {});
      env.alias = 'foo';
      assert.equal(env.alias, 'foo');
      assert.equal(env.name, 'verb-readme-generator');
    });

    it('should support a custom alias function', function() {
      var env = base.createEnv('verb-readme-generator', fixtures('verb-readme-generator'), {
        toAlias: function(name) {
          return name.replace(/^verb-(.*?)-generator/, '$1');
        }
      });
      assert.equal(env.alias, 'readme');
      assert.equal(env.name, 'verb-readme-generator');
    });

    it('should expose env as `this` to custom alias function', function() {
      var env = base.createEnv('verb-readme-generator', fixtures('verb-readme-generator'), {
        toAlias: function(name) {
          return this.name.replace(/^verb-(.*?)-generator/, '$1');
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

    it('should throw an error when env.fn is not a function', function(cb) {
      try {
        var env = base.createEnv(fixtures('not-exported'));
        env.fn;
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'expected file.path to export a function or instance');
        cb();
      }
    });
  });

  describe('env.isMatch', function() {
    it('should return true when val matches env.name', function() {
      var env = base.createEnv('verb-readme-generator', function() {});
      assert.equal(env.isMatch('verb-readme-generator'), true);
    });

    it('should return true when val matches env.alias', function() {
      var env = base.createEnv('verb-readme-generator', function() {}, {
        toAlias: function() {
          return 'foo';
        }
      });
      assert.equal(env.isMatch('verb-readme-generator'), true);
      assert.equal(env.isMatch('foo'), true);
    });

    it('should return false when val does not match', function() {
      var env = base.createEnv('foo-bar-baz', function() {}, {
        toAlias: function() {
          return 'foo';
        }
      });
      assert.equal(env.isMatch('bar'), false);
    });
  });
});
