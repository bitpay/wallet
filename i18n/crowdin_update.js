#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var bhttp = require('bhttp');

var crowdin_identifier = 'copay'

var local_file_name1 = path.join(__dirname, 'po/template.pot')

// Similar to Github, normalize all line breaks to CRLF so that different people
// using different OSes to update does not constantly swith format back and forth.
var local_file1_text = fs.readFileSync(local_file_name1, 'utf8');
local_file1_text = local_file1_text.replace(/\r\n/g, '\n');
local_file1_text = local_file1_text.replace(/\n/g, '\r\n');
fs.writeFileSync(local_file_name1, local_file1_text);

var local_file1 = fs.createReadStream(local_file_name1)

var local_file_name2 = path.join(__dirname, 'docs/appstore_en.txt')

var local_file2_text = fs.readFileSync(local_file_name2, 'utf8');
local_file2_text = local_file2_text.replace(/\r\n/g, '\n');
local_file2_text = local_file2_text.replace(/\n/g, '\r\n');
fs.writeFileSync(local_file_name2, local_file2_text);

var local_file2 = fs.createReadStream(local_file_name2)

var local_file_name3 = path.join(__dirname, 'docs/updateinfo_en.txt')

var local_file3_text = fs.readFileSync(local_file_name3, 'utf8');
local_file3_text = local_file3_text.replace(/\r\n/g, '\n');
local_file3_text = local_file3_text.replace(/\n/g, '\r\n');
fs.writeFileSync(local_file_name3, local_file3_text);

var local_file3 = fs.createReadStream(local_file_name3)

// obtain the crowdin api key
var crowdin_api_key = fs.readFileSync(path.join(__dirname, 'crowdin_api_key.txt'))
  //console.log('api key: ' + crowdin_api_key);

if (crowdin_api_key != '') {

  var payload = {
    'files[template.pot]': local_file1,
    'files[appstore/appstore_en.txt]': local_file2,
    'files[appstore/updateinfo_en.txt]': local_file3
  };

  bhttp.post('https://api.crowdin.com/api/project/' + crowdin_identifier + '/update-file?key=' + crowdin_api_key, payload, {}, function(err, response) {
    if (!err) console.log('\nResponse from update file call:\n', response.body.toString());
    else console.log('\nError from update file call:\n', err.toString());

    // This call will tell the server to generate a new zip file for you based on most recent translations.
    https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/export?key=' + crowdin_api_key, function(res) {
      console.log('Export Got response: ' + res.statusCode);
      res.on('data', function(chunk) {
        console.log(chunk.toString('utf8'));
      });
    }).on('error', function(e) {
      console.log('Export Got error: ' + e.message);
    });
  })
};
