#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var AdmZip = require('adm-zip');
var bhttp = require('bhttp');

var crowdin_identifier = 'copay'

var local_file_name1 = path.join(__dirname, 'po/template.pot')
var local_file1 = fs.createReadStream(local_file_name1)

var local_file_name2 = path.join(__dirname, 'docs/appstore_en.txt')
var local_file2 = fs.createReadStream(local_file_name2)

var local_file_name3 = path.join(__dirname, 'docs/updateinfo_en.txt')
var local_file3 = fs.createReadStream(local_file_name3)

// obtain the crowdin api key
var crowdin_api_key = fs.readFileSync(path.join(__dirname, 'crowdin_api_key.txt')).slice(3) //slicing utf-8 BOM
//console.log('api key: ' + crowdin_api_key);

if (crowdin_api_key != '') {
  
  var payload = {
    'files[template.pot]': local_file1,
    'files[appstore/appstore_en.txt]': local_file2,
    'files[appstore/updateinfo_en.txt]': local_file3
  };

  bhttp.post('https://api.crowdin.com/api/project/' + crowdin_identifier + '/update-file?key=' + crowdin_api_key, payload, {}, function(err, response) {
    console.log('Response from update file call:', response.body.toString());
    
    // This call will tell the server to generate a new zip file for you based on most recent translations.
    https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/export?key=' + crowdin_api_key, function(res) {
      console.log('Export Got response: ' + res.statusCode);
    }).on('error', function(e) {
      console.log('Export Got error: ' + e.message);
    });
  })
  
};


// Download most recent translations for all languages.
https.get('https://crowdin.com/download/project/' + crowdin_identifier + '.zip', function(res) {
  var data = [], dataLen = 0; 
  
  res.on('data', function(chunk) {
      data.push(chunk);
      dataLen += chunk.length;
    }).on('end', function() {
      var buf = new Buffer(dataLen);
      for (var i=0, len = data.length, pos = 0; i < len; i++) {
        data[i].copy(buf, pos);
        pos += data[i].length;
      };
      var zip = new AdmZip(buf);
      zip.extractAllTo('./', true);
      console.log('Done extracting ZIP file.');
      
    });
});

