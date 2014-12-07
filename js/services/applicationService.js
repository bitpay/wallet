'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $location, $timeout) {
    var root = {};
    var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;

    root.restart = function() {
      if (window.cordova !== undefined) {
        $rootScope.iden = $rootScope.wallet = undefined;
        // NOP. no need to restart on cordova apps.
        $location.path('/');
        $timeout(function(){
          $rootScope.$digest();
        },1);
      
      } else {

        // Go home reloading the application
        var hashIndex = window.location.href.indexOf('#!/');
        if (isChromeApp) {
          chrome.runtime.reload();
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });
