'use strict';
angular.module('copayApp.services').factory('feedbackService', function($http, $log, $httpParamSerializer, configService) {
  var root = {};
  var URL = "https://script.google.com/macros/s/AKfycbybtvNSQKUfgzgXcj3jYLlvCKrcBoktjiJ1V8_cwd2yVkpUBGe3/exec";

  root.send = function(dataSrc, cb) {
    $http(_post(dataSrc)).then(function() {
      $log.info("SUCCESS: Feedback sent");
      return cb();
    }, function(err) {
      $log.info("ERROR: Feedback sent anyway.");
      return cb(err);
    });
  };

  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  root.isVersionUpdated = function(currentVersion, savedVersion) {

    if (!verifyTagFormat(currentVersion))
      return 'Cannot verify the format of version tag: ' + currentVersion;
    if (!verifyTagFormat(savedVersion))
      return 'Cannot verify the format of the saved version tag: ' + savedVersion;

    var current = formatTagNumber(currentVersion);
    var saved = formatTagNumber(savedVersion);
    if (saved.major > current.major || (saved.major == current.major && saved.minor > current.minor))
      return false;

    return true;

    function verifyTagFormat(tag) {
      var regex = /^v?\d+\.\d+\.\d+$/i;
      return regex.exec(tag);
    };

    function formatTagNumber(tag) {
      var formattedNumber = tag.replace(/^v/i, '').split('.');
      return {
        major: +formattedNumber[0],
        minor: +formattedNumber[1],
        patch: +formattedNumber[2]
      };
    };

  };

  return root;
});
