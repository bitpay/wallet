'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, isCordova, isChromeApp) {
    var root = {};

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });
