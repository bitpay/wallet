#!/usr/bin/env node

'use strict';

if (process.argv[2]) {
  var no_build = (process.argv[2].toLowerCase() == '--nobuild')
  if (no_build == false) {
    console.log('Incorrect arg. Please use --nobuild if you would like to download without api key.');
    process.exit(1);
  };
} else {
  var no_build = false;
  console.log('\n' +
              'Please note: If you do not have the crowdin API key and would like to download the ' +
              'translations without building anyways, please make sure your English files are the same ' +
              'version as crowdin, and then run this script with --nobuild\n\n' +
              'eg. "node crowdin_download.js --nobuild"\n\n');
};

var fs = require('fs');
var path = require('path');
var https = require('https');
var AdmZip = require('adm-zip');

var crowdin_identifier = 'copay'

var local_file_name2 = path.join(__dirname, 'docs/appstore_en.txt')
var local_file_name3 = path.join(__dirname, 'docs/updateinfo_en.txt')

try {
    fs.statSync(local_file_name2);
    fs.statSync(local_file_name3);
}
catch (e) {
    console.log('\n### ABORTING ### One of the following files does not exist:\n' + local_file_name2 + '\n' + local_file_name3);
    process.exit(1);
}

try {
  // obtain the crowdin api key
  var crowdin_api_key = fs.readFileSync(path.join(__dirname, 'crowdin_api_key.txt'), 'utf8')
} catch (e) {
  console.log('### ERROR ### You do not have the crowdin api key in ./crowdin_api_key.txt');
  process.exit(1);
};

if (no_build == false) { // Reminder: Any changes to the script below must also be made to the else clause and vice versa. 

  // This call will tell the server to generate a new zip file for you based on most recent translations.
  https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/export?key=' + crowdin_api_key, function(res) {
    
    console.log('Export Got response: ' + res.statusCode);
    
    res.on('data', function(chunk) {
      var resxml = chunk.toString('utf8');
      console.log(resxml);
      
      if (resxml.indexOf('status="skipped"') >= 0) {
        console.log('Translation build was skipped due to either:\n' +
                    '1. No changes since last translation build, or\n' +
                    '2. API limit of once per 30 minutes has not been waited.\n\n' +
                    'Since we can not guarantee that translations have been built properly, this script will end here.\n' +
                    'Log in to Copay\'s Crowdin Settings and click the "Build Project" button to assure it is built recently, and then run this ' +
                    'script again with the --nobuild arg to download translations without checking if built.');
        process.exit(1);
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
            
            var files = fs.readdirSync('./docs');
            
            for (var i in files) {
              debugger;
              if (files[i].slice(0,9) == 'appstore_' && files[i].slice(-4) == '.txt' && files[i] != 'appstore_en.txt') {
                var english_file = fs.readFileSync(local_file_name2, 'utf8');
                var compare_file = fs.readFileSync(path.join(__dirname, 'docs/' + files[i]), 'utf8')
                english_file = english_file.replace(/\r\n/g, '\n');
                compare_file = compare_file.replace(/\r\n/g, '\n');
                if (compare_file == english_file) {
                  fs.unlinkSync(path.join(__dirname, 'docs/' + files[i]));
                };
              };
              if (files[i].slice(0,11) == 'updateinfo_' && files[i].slice(-4) == '.txt' && files[i] != 'updateinfo_en.txt') {
                var english_file = fs.readFileSync(local_file_name3, 'utf8');
                var compare_file = fs.readFileSync(path.join(__dirname, 'docs/' + files[i]), 'utf8')
                english_file = english_file.replace(/\r\n/g, '\n');
                compare_file = compare_file.replace(/\r\n/g, '\n');
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
                var po_array = po_file.split('\n');
                for (var j in po_array) {
                  if (po_array[j].slice(0,5) == 'msgid') {
                    var source_text = po_array[j].slice(5);
                  } else if (po_array[j].slice(0,6) == 'msgstr') {
                    var translate_text = po_array[j].slice(6);
                    // if a line is not == English, it means there is translation. Keep this file.
                    if (source_text != translate_text) {
                      // erase email addresses of last translator for privacy
                      po_file = po_file.replace(/ <.+@.+\..+>/, '')
                      fs.writeFileSync(path.join(__dirname, 'po/' + files[i]), po_file);
                      
                      // split the file into 3 parts, before locale, locale, and after locale.
                      var lang_pos = po_file.search('"Language: ') + 11;
                      var po_start = po_file.slice(0,lang_pos);
                      var po_locale = po_file.slice(lang_pos,lang_pos + 5);
                      var po_end = po_file.slice(lang_pos + 5);
                      
                      // check for underscore, if it's there, only take the first 2 letters and reconstruct the po file.
                      if (po_locale.search('_') > 0) {
                        fs.writeFileSync(path.join(__dirname, 'po/' + files[i]), po_start + po_locale.slice(0,2) + po_end);
                        po_start = '';
                        po_locale = '';
                        po_end = '';
                      };
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
    });
  }).on('error', function(e) {
    console.log('Export Got error: ' + e.message);
  });

} else { // Reminder: Any changes to the script below must also be made to the above and vice versa.

  // Download most recent translations for all languages.
  https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/download/all.zip?key=' + crowdin_api_key, function(res) {
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
            english_file = english_file.replace(/\r\n/g, '\n');
            compare_file = compare_file.replace(/\r\n/g, '\n');
            if (compare_file == english_file) {
              fs.unlinkSync(path.join(__dirname, 'docs/' + files[i]));
            };
          };
          if (files[i].slice(0,11) == 'updateinfo_' && files[i].slice(-4) == '.txt' && files[i] != 'updateinfo_en.txt') {
            var english_file = fs.readFileSync(local_file_name3, 'utf8');
            var compare_file = fs.readFileSync(path.join(__dirname, 'docs/' + files[i]), 'utf8')
            english_file = english_file.replace(/\r\n/g, '\n');
            compare_file = compare_file.replace(/\r\n/g, '\n');
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
            var po_array = po_file.split('\n');
            for (var j in po_array) {
              if (po_array[j].slice(0,5) == 'msgid') {
                var source_text = po_array[j].slice(5);
              } else if (po_array[j].slice(0,6) == 'msgstr') {
                var translate_text = po_array[j].slice(6);
                // if a line is not == English, it means there is translation. Keep this file.
                if (source_text != translate_text) {
                  // erase email addresses of last translator for privacy
                  po_file = po_file.replace(/ <.+@.+\..+>/, '')
                  fs.writeFileSync(path.join(__dirname, 'po/' + files[i]), po_file);
                  
                  // split the file into 3 parts, before locale, locale, and after locale.
                  var lang_pos = po_file.search('"Language: ') + 11;
                  var po_start = po_file.slice(0,lang_pos);
                  var po_locale = po_file.slice(lang_pos,lang_pos + 5);
                  var po_end = po_file.slice(lang_pos + 5);
                  
                  // check for underscore, if it's there, only take the first 2 letters and reconstruct the po file.
                  if (po_locale.search('_') > 0) {
                    fs.writeFileSync(path.join(__dirname, 'po/' + files[i]), po_start + po_locale.slice(0,2) + po_end);
                    po_start = '';
                    po_locale = '';
                    po_end = '';
                  };
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
};
