'use strict';
angular.module('copayApp.services').factory('feedbackService', function($http, $log, $httpParamSerializer, configService) {
  var root = {};
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

    var config = configService.getSync();
    var url = config.feedback.url;
    return {
      method: 'POST',
      url: url,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  return root;
});
