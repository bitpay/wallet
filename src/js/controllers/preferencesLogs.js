'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function($scope, historicLog, $ionicNavBarDelegate, gettextCatalog) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('Session Log'));

    $scope.init = function() {
      $scope.logs = historicLog.get();
    }

    $scope.prepare = function() {
      var log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
      log += '\n\n';
      log += $scope.logs.map(function(v) {
        return v.msg;
      }).join('\n');

      return log;
    };

    $scope.sendLogs = function() {
      var body = $scope.prepare();

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
