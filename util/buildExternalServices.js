#!/usr/bin/env node

'use strict';

var fs = require('fs');
var file;

try {
  file = fs.readFileSync('./externalServices.json', 'utf8');
} catch(err) {
  return;
}

var externalServices = JSON.parse(file);
if (externalServices.coinbase &&
    externalServices.coinbase.production.client_id)
  console.log('Coinbase Production Enabled');
if (externalServices.coinbase &&
    externalServices.coinbase.sandbox.client_id)
  console.log('Coinbase Sandbox Enabled');
if (externalServices.glidera &&
    (externalServices.glidera.production.mobile.client_id || externalServices.glidera.production.desktop.client_id))
  console.log('Glidera Production Enabled');
if (externalServices.glidera &&
    (externalServices.glidera.sandbox.mobile.client_id || externalServices.glidera.sandbox.desktop.client_id))
  console.log('Glidera Sandbox Enabled');
if (externalServices.shapeshift &&
    externalServices.shapeshift.api_key)
  console.log('Shapeshift PUBLIC KEY found!');

var content = 'window.externalServices=' + JSON.stringify(externalServices) + ';';
fs.writeFileSync("./src/js/externalServices.js", content);

