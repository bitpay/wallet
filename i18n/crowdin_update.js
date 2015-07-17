#!/usr/bin/env node

'use strict';

var fs = require('fs')
var querystring = require('querystring');
var http = require('http');
var AdmZip = require('adm-zip');

var crowdin_identifier = 'copay'

var crowdin_file_name1 = 'template.pot'
var local_file_name1 = './po/template.pot'

var crowdin_file_name2 = 'template.pot'
var local_file_name2 = './docs/appstore_en'

// obtain the crowdin api key
var crowdin_api_key = '';
fs.readFile('./crowdin_api_key.txt', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  crowdin_api_key = data;
});


if (crowdin_api_key != '') {
  var host_url = 'http://api.crowdin.com/api/project/' + crowdin_identifier + '/update-file?key=' + crowdin_api_key;
  
  var post_data = querystring.stringify({
      'files[' + crowdin_file_name1 + ']' : '@' + local_file_name1,
      'files[' + crowdin_file_name2 + ']' : '@' + local_file_name2
  });
  
  var post_options = {
      host: host_url,
      port: '80',
      path: '',
      method: 'POST',
      headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Length': post_data.length
      }
  };
  
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });
  
  post_req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  
  post_req.write(post_data);
  
  // This post updates the english files on crowdin.
  // https://crowdin.com/page/api/update-file
  post_req.end();
  
  // This call will tell the server to generate a new zip file for you based on most recent translations.
  http.get('http://api.crowdin.com/api/project/' + crowdin_identifier + '/export?key=' + crowdin_api_key, function(res) {
    console.log("Got response: " + res.statusCode);
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
  
};


// Download most recent translations for all languages.
http.get('http://crowdin.com/download/project/' + crowdin_identifier + '.zip', function(res) {
  var data = [], dataLen = 0; 
  
  res.on('data', function(chunk) {
      data.push(chunk);
      dataLen += chunk.length;
    }).on('end', function() {
      var buf = new Buffer(dataLen);
      for (var i=0, len = data.length, pos = 0; i < len; i++) { 
        data[i].copy(buf, pos); 
        pos += data[i].length; 
      } 
      var zip = new AdmZip(buf);
      var zipEntries = zip.getEntries();
      console.log(zipEntries.length)
      for (var i = 0; i < zipEntries.length; i++) {
        // parse each file from the zip, ex. http://crowdin.com/download/project/electrum.zip
        // the filename for each file is the same, but they are separated into locale folder names.
        // those foldernames might be able to be used to automatically rename each file to 'locale.po' like current.
        
        console.log(zip.readAsText(zipEntries[i]));
      };
    });
});

