#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var AdmZip = require('adm-zip');

var crowdin_identifier = 'copay'

var local_file_name2 = path.join(__dirname, 'docs/appstore_en.txt')
var local_file_name3 = path.join(__dirname, 'docs/updateinfo_en.txt')

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
      
      var files = fs.readdirSync('./docs');
      
      for (var i in files) {
        if (files[i].slice(0,9) == 'appstore_' && files[i].slice(-4) == '.txt' && files[i] != 'appstore_en.txt') {
          var english_file = fs.readFileSync(local_file_name2, 'utf8');
          var compare_file = fs.readFileSync(path.join(__dirname, 'docs/' + files[i]), 'utf8')
          if (compare_file == english_file) {
            fs.unlinkSync(path.join(__dirname, 'docs/' + files[i]));
          };
        };
        if (files[i].slice(0,11) == 'updateinfo_' && files[i].slice(-4) == '.txt' && files[i] != 'updateinfo_en.txt') {
          var english_file = fs.readFileSync(local_file_name3, 'utf8');
          var compare_file = fs.readFileSync(path.join(__dirname, 'docs/' + files[i]), 'utf8')
          if (compare_file == english_file) {
            fs.unlinkSync(path.join(__dirname, 'docs/' + files[i]));
          };
        };
      };
      
      console.log('Cleaned out completely untranslated appstore docs.');
      
      var files = fs.readdirSync('./po');
      
      for (var i in files) {
        if (files[i] != 'template.pot') {
          var po_file = fs.readFileSync(path.join(__dirname, 'po/' + files[i]), 'utf8');
          var lang_pos = po_file.search('"Language: ') + 11;
          var po_start = po_file.slice(0,lang_pos);
          var po_locale = po_file.slice(lang_pos,lang_pos + 5);
          var po_end = po_file.slice(lang_pos + 5);
          
          if (po_locale.search('_') > 0) {
            fs.writeFileSync(path.join(__dirname, 'po/' + files[i]), po_start + po_locale.slice(0,2) + po_end);
            po_start = '';
            po_locale = '';
            po_end = '';
          };
          
          var po_array = po_file.split('\n');
          for (var j in po_array) {
            if (po_array[j].slice(0,5) == 'msgid') {
              var source_text = po_array[j].slice(5);
            } else if (po_array[j].slice(0,6) == 'msgstr') {
              var translate_text = po_array[j].slice(6);
              if (source_text != translate_text) {
                break;
              };
            };
            if (j == po_array.length - 1) { // All strings are exactly identical to English. Delete po file.
              fs.unlinkSync(path.join(__dirname, 'po/' + files[i]));
            };
          };
        };
      };
      
      console.log('Cleaned out completely untranslated po files.');
      
    });
});
