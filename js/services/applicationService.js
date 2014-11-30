'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function() {
      var root = {};

      root.restart = function() {
        // Go home reloading the application
        var hashIndex = window.location.href.indexOf('#!/');
        window.location = window.location.href.substr(0, hashIndex);
      };

      root.reload = function() {
        window.location.reload();
      };

      return root;
  });
