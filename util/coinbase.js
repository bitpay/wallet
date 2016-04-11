#!/usr/bin/env node

'use strict';

var fs = require('fs');
var file;

try { 
    file = fs.readFileSync('./coinbase.json', 'utf8');
} catch(err) {
  return;
}

var json = JSON.parse(file);
console.log('Coinbase Client ID: ' + json.client_id);

var content = 'window.coinbase_client_id="' + json.client_id + '";';
content = content + '\nwindow.coinbase_client_secret="' + json.client_secret + '";';
fs.writeFileSync("./src/js/coinbase.js", content);

