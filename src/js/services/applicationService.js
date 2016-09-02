'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, platformInfo, $state) {
    var root = {};

    var isChromeApp = platformInfo.isChromeApp;
    var isNW = platformInfo.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfo.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else if (isNW) {
          $ionicHistory.clearHistory();
          $state.go('tabs.home');
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });
