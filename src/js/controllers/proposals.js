
'use strict';

angular.module('copayApp.controllers').controller('proposalsController',
  function($timeout, $scope, profileService, $log, txpModalService) {
    var self = this;


    $scope.init = function() {
      profileService.getTxps(50, function(err, txps) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        $scope.txps = txps;
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    }

    $scope.openTxpModal = txpModalService.open;
  });
