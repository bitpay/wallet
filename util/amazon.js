#!/usr/bin/env node

'use strict';

var fs = require('fs');
var file;

try {
  file = fs.readFileSync('./amazon.json', 'utf8');
} catch (err) {
  return;
}

var json = JSON.parse(file);

var content = '\nwindow.amazon_sandbox_bitpay_api_token="' + json.sandbox.bitpay_api_token + '";';
content = content + '\nwindow.amazon_sandbox_bitpay_api_url="' + json.sandbox.bitpay_api_url + '";';
content = content + '\nwindow.amazon_bitpay_api_token="' + json.production.bitpay_api_token + '";';
content = content + '\nwindow.amazon_bitpay_api_url="' + json.production.bitpay_api_url + '";';
fs.writeFileSync("./src/js/amazon.js", content);
