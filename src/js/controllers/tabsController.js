
'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($log, $scope, $ionicModal, incomingData) {

    $scope.onScan = function(data) {
console.log('[tabsController.js.6:data:]',data); //TODO
      if (!incomingData.redir(data)) {
        $ionicPopup.alert({
          title: 'Invalid data',
        });
      }
    }

    $scope.setScanFn = function(scanFn) {
      $scope.scan = function() {
        $log.debug('Scanning...');
        scanFn();
      };
    };
  });
