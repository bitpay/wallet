#!/usr/bin/env node

'use strict';

var fs = require('fs');
var file;

try { 
    file = fs.readFileSync('./amazon.json', 'utf8');
} catch(err) {
  return;
}

var json = JSON.parse(file);
console.log('Amazon Partner ID: ' + json.production.partner_id);

var content = 'window.amazon_sandbox_access_key="' + json.sandbox.access_key + '";';
content = content + '\nwindow.amazon_sandbox_secret_key="' + json.sandbox.secret_key + '";';
content = content + '\nwindow.amazon_sandbox_partner_id="' + json.sandbox.partner_id + '";';
content = content + '\nwindow.amazon_sandbox_currency_code="' + json.sandbox.currency_code + '";';
content = content + '\nwindow.amazon_sandbox_region="' + json.sandbox.region + '";';
content = content + '\nwindow.amazon_sandbox_endpoint="' + json.sandbox.endpoint + '";';
content = content + '\nwindow.amazon_sandbox_bitpay_api_token="' + json.sandbox.bitpay_api_token + '";';
content = content + '\nwindow.amazon_sandbox_bitpay_api_url="' + json.sandbox.bitpay_api_url + '";';
content = content + '\nwindow.amazon_access_key="' + json.production.access_key + '";';
content = content + '\nwindow.amazon_secret_key="' + json.production.secret_key + '";';
content = content + '\nwindow.amazon_partner_id="' + json.production.partner_id + '";';
content = content + '\nwindow.amazon_currency_code="' + json.production.currency_code + '";';
content = content + '\nwindow.amazon_region="' + json.production.region + '";';
content = content + '\nwindow.amazon_endpoint="' + json.production.endpoint + '";';
content = content + '\nwindow.amazon_bitpay_api_token="' + json.production.bitpay_api_token + '";';
content = content + '\nwindow.amazon_bitpay_api_url="' + json.production.bitpay_api_url + '";';
fs.writeFileSync("./src/js/amazon.js", content);

