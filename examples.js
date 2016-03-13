'use strict';

var env = require('./');
var Base = require('base');
var base = new Base();
base.two = 'three';
var app = new Base();
app.parent = base;

var opts = {};
opts.aliasFn = function(name, env) {
  return name.replace(/^verb-(.*)-generator?$/, '$1');
};

base.use(env(opts));

var a = base.createEnv('verb-readme-generator', function() {});
console.log(a);
var b = base.createEnv('readme', function() {});
console.log(b);
var c = base.createEnv('readme', 'fixtures/verb-readme-generator');
console.log(c);
c.invoke(app);
console.log(app);

var d = base.createEnv('readme', new Base());
console.log(d);
console.log(d.app);
// console.log(d.fn);
console.log(Base);
var dd = base.createEnv('readme', new Base(), {});
console.log(dd);
console.log(dd.app);
var e = base.createEnv('fixtures/verb-readme-generator');
console.log(e);
console.log(e.isMatch('foo'));
console.log(e.isMatch('readme'));
