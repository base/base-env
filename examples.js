'use strict';

var Base = require('base');
var Env = require('./lib/env');

function generator(app, base, options, env) {
  console.log(arguments);
};
var app = new Base({isApp: true});
var env = new Env('generate-foo', generator, app);

console.log(env.invoke());
