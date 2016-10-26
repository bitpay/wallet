
'use strict';

angular.module('copayApp.controllers').controller('proposalsController',
  function($timeout, $scope, profileService, $log, txpModalService) {

    $scope.fetchingProposals = true;

    $scope.$on("$ionicView.enter", function(event, data){
      profileService.getTxps(50, function(err, txps) {
        $scope.fetchingProposals = false;
        if (err) {
          $log.error(err);
          return;
        }
        $scope.txps = txps;
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    });

    $scope.openTxpModal = txpModalService.open;
  });
