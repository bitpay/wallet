#! /usr/bin/node

'use strict';



var sys = require('sys')
var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
  sys.puts(stdout)
}

function isNumber(n) {
  return !isNaN(parseInt(n)) && isFinite(n);
}

var args = process.argv.slice(2);
var n_str = args[0];
if (!isNumber(n_str)) {
  console.log('Program requires one numeric argument for the amount of copayers');
  process.exit(1);
}

var N = parseInt(n_str);
var DEFAULT_PORT = process.env.DEFAULT_PORT || 3000;


for (var i = 0; i < N; i++) {
  var port = (i + DEFAULT_PORT);
  console.log('Simulating copayer #' + (i + 1) + ' at http://localhost:' + port);
  var command = 'PORT=' + port + ' npm start &'
  exec(command, puts);
}
