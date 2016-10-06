'use strict';

var AndroidManifest = require('androidmanifest');

var FILEPATH = 'platforms/android/AndroidManifest.xml';
var manifest = new AndroidManifest().readFile(FILEPATH);

var mainActivity = manifest.activity('MainActivity');

var customUrls = ['copay', 'bitcoin', 'bitauth'];

customUrls.forEach(function(url){
  var selector = 'intent-filter > data[android\\:scheme=' + url + ']';
  if(mainActivity.find(selector).length > 0){
    return;
  }

  var intentFilter = manifest.$('<intent-filter>');
  intentFilter.append('<data android:scheme="' + url + '" />');
  intentFilter.append('<action android:name="android.intent.action.VIEW" />');
  intentFilter.append('<category android:name="android.intent.category.DEFAULT" />');
  intentFilter.append('<category android:name="android.intent.category.BROWSABLE" />');
  mainActivity.append(intentFilter);
});

manifest.writeFile(FILEPATH);
console.log('custome uri schemes written to AndroidManifest');
