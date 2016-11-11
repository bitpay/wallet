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

  return root;
});
