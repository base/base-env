'use strict';

require('mocha');
var Base = require('base');
var plugins = require('base-plugins');
var namespace = require('base-namespace');
var assert = require('assert');
var Env = require('../lib/env');
var env;

describe('Env', function() {
  before(function() {
    Base.use(function() {
      this.isApp = true;
      this.use(namespace());
    });
  });

  it('should stack aliases from parent instances to create a namespace', function() {
    var foo = new Base();
    foo.alias = 'foo';
    
    var bar = new Base();
    bar.alias = 'bar';
    bar.parent = foo;
    
    var baz = new Base();
    baz.alias = 'baz';
    baz.parent = bar;

    var a = new Env('a', function() {}, foo);
    var b = new Env('b', function() {}, bar);
    var c = new Env('c', function() {}, baz);

    assert.equal(c.namespace, 'foo.bar.baz.c');
  });
});
