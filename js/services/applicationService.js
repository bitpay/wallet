'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function() {
    var root = {};
    var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;

    root.restart = function() {

      console.log('RESTART');

      // Go home reloading the application
      var hashIndex = window.location.href.indexOf('#!/');
      if (isChromeApp) {
        console.log('isChromeApp  restting ');
        chrome.runtime.restart();
      } else {
        window.location = window.location.href.substr(0, hashIndex);
      }
    };

    root.reload = function() {
      window.location.reload();
    };

    return root;
  });
