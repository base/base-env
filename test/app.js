'use strict';

require('mocha');
var path = require('path');
var Base = require('base');
var plugins = require('base-plugins');
var option = require('base-option');
var assert = require('assert');
var env = require('..');
var base;

var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('instances', function() {
  beforeEach(function() {
    Base.use(plugins());
    Base.use(env());
    base = new Base();
  });

  describe('createEnv', function() {
    it('should create an env object from an instance', function() {
      var env = base.createEnv('foo', new Base());
      assert(env);
    });

    it('should support options as the last argument', function() {
      var env = base.createEnv('foo', new Base(), {foo: 'bar'});
      assert(env);
      assert.equal(env.foo, 'bar');
    });

    it('should support options as the second argument', function() {
      var env = base.createEnv('foo', {foo: 'bar'}, new Base());
      assert(env);
      assert.equal(env.foo, 'bar');
    });
  });
  
  describe('env.invoke', function() {
    it('should return the cached instance when `invoke` is called (noop)', function() {
      var env = base.createEnv('foo-bar-baz', new Base());
      assert.deepEqual(env.invoke(), env.app);
    });

    it('should wrap exported instances in a function', function() {
      var env = base.createEnv(fixtures('instance'));
      assert.equal(typeof env.fn, 'function');
      assert.deepEqual(env.fn(), require(fixtures('instance')));
    });

    it('should merge options onto the invoked instance', function() {
      var app = new Base();
      app.options.a = 'b';

      var env = base.createEnv('foo-bar-baz', app);
      assert.equal(typeof app.options.c, 'undefined');
      assert.equal(app.options.a, 'b');
      env.invoke({c: 'd'});
      assert.equal(app.options.a, 'b');
      assert.equal(typeof app.options.c, 'undefined');
    });

    it('should ', function() {
      var app = new Base();
      var foo = new Base();
      foo.options.x = 'blah';
      foo.cache.one = 'blah';
      app.options.a = 'b';
      app.cache.two = 'b';

      var env = base.createEnv('foo-bar-baz', app);
      assert.equal(typeof app.options.c, 'undefined');
      assert.equal(app.options.a, 'b');
      env.invoke(foo, {c: 'd'});
      assert.equal(app.options.a, 'b');
      assert.equal(typeof app.options.c, 'undefined');
    });

    it('should merge options onto the invoked instance using `app.option`', function() {
      var app = new Base();
      app.use(option());
      app.options.a = 'b';

      var env = base.createEnv('foo-bar-baz', app);
      assert.equal(typeof app.options.c, 'undefined');
      assert.equal(app.options.a, 'b');
      env.invoke({c: 'd'});
      assert.equal(app.options.a, 'b');
      assert.equal(app.options.c, 'd');
    });

    it('should merge options onto the invoked instance when an app is passed', function() {
      var foo = new Base();
      var bar = new Base();
      foo.options.a = 'b';

      var env = base.createEnv('foo-bar-baz', foo);
      assert.equal(typeof foo.options.c, 'undefined');
      assert.equal(foo.options.a, 'b');
      env.invoke(bar, {c: 'd'});
      assert.equal(foo.options.a, 'b');
      assert.equal(typeof foo.options.c, 'undefined');
    });
  });

  describe('env.inspect', function() {
    it('should expose an inspect method', function() {
      var env = base.createEnv('foo', new Base());
      assert(env.inspect);
      assert.equal(typeof env.inspect, 'function');
    });

    it('should show [instance] when env is created from an instance', function() {
      var env = base.createEnv('foo', new Base());
      assert(/<Env "foo" \[instance base\]>/.test(env.inspect()));
    });
  });

  describe('env.namespace', function() {
    it('should expose a namespace property', function() {
      var env = base.createEnv('foo', new Base());
      assert(env.namespace);
      assert.equal(typeof env.namespace, 'string');
    });

    it('should set env.name to env.namespace', function() {
      var env = base.createEnv('foo', new Base());
      assert.equal(env.namespace, 'foo');
    });

    it('should prefix env.namespace with parent.namespace', function() {
      var app = new Base();
      app.namespace = 'abc';

      var env = base.createEnv('foo', new Base(), {parent: app});
      assert.equal(env.namespace, 'abc.foo');
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

    it('should update alias', function() {
      var env = base.createEnv('foo-bar-baz', new Base());
      env.alias = 'abc';
      assert.equal(env.alias, 'abc');
    });

    it('should support a custom alias function', function() {
      var env = base.createEnv('foo-bar-baz', new Base(), {
        toAlias: function() {
          return 'foo';
        }
      });
      assert.equal(env.name, 'foo-bar-baz');
      assert.equal(env.alias, 'foo');
    });
  });

  describe('env.isMatch', function() {
    it('should return true when val matches env.name', function() {
      var env = base.createEnv('foo-bar-baz', new Base());
      assert.equal(env.isMatch('foo-bar-baz'), true);
    });

    it('should return true when val matches env.alias', function() {
      var env = base.createEnv('foo-bar-baz', new Base(), {
        toAlias: function() {
          return 'foo';
        }
      });
      assert.equal(env.isMatch('foo'), true);
    });

    it('should return false when val does not match', function() {
      var env = base.createEnv('foo-bar-baz', new Base(), {
        toAlias: function() {
          return 'foo';
        }
      });
      assert.equal(env.isMatch('bar'), false);
    });
  });
});
