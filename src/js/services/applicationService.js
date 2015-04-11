'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, isCordova) {
    var root = {};

    root.restart = function(hard) {
      if (isCordova) {
        $rootScope.iden = $rootScope.wallet = undefined;
        if (hard) {
          location.reload();
        }
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        var hashIndex = window.location.href.indexOf('#!/');
        window.location = window.location.href.substr(0, hashIndex);
      }
    };

    return root;
  });
