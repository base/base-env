'use strict';

var env = require('./');
var plugins = require('base-plugins');
var Base = require('base');
Base.use(plugins());
Base.use(env());

var base = new Base();
base.two = 'three';
var app = new Base();
app.parent = base;

var opts = {};
opts.aliasFn = function(name, env) {
  return name.replace(/^verb-(.*)-generator?$/, '$1');
};

// var a = base.createEnv('verb-readme-generator', function() {}, opts);
// console.log(a);
// var b = base.createEnv('readme', function() {});
// console.log(b);
var c = base.createEnv('readme', 'test/fixtures/verb-readme-generator');
console.log(c);
c.invoke(app);
console.log(app);
// var d = base.createEnv('verb-readme-generator', opts, function() {});
// console.log(d);

// var d = base.createEnv('readme', new Base());
// console.log(d);
// console.log(d.app);
// console.log(d.fn);
// console.log(Base);
// var dd = base.createEnv('readme', new Base(), {});
// console.log(dd);
// console.log(dd.app);
// var e = base.createEnv('test/fixtures/verb-readme-generator');
// console.log(e);
// console.log(e.isMatch('foo'));
// console.log(e.isMatch('readme'));
