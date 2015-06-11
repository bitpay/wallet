'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, isCordova, isChromeApp, nodeWebkit, go) {
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
          if (nodeWebkit.isDefined()) {
            go.walletHome();
            $timeout(function() {
              var win = require('nw.gui').Window.get();
              win.reload(3);
              //or
              win.reloadDev();
            }, 100);
          } else {
            chrome.runtime.reload();
          }
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });
