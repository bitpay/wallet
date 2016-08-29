'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function($scope, historicLog, $ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('Session Log'));

    $scope.init = function() {
      $scope.logs = historicLog.get();
    }

    $scope.sendLogs = function() {
      var body = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
      body += '\n\n';
      body += $scope.logs.map(function(v) {
        return v.msg;
      }).join('\n');

      window.plugins.socialsharing.shareViaEmail(
        body,
        'Copay Logs',
        null, // TO: must be null or an array
        null, // CC: must be null or an array
        null, // BCC: must be null or an array
        null, // FILES: can be null, a string, or an array
        function() {},
        function() {}
      );
    };
  });
