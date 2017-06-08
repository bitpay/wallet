'use strict';

angular.module('copayApp.controllers').controller('proposalsController',
  function($timeout, $scope, profileService, $log, txpModalService, addressbookService, timeService) {

    $scope.fetchingProposals = true;

    $scope.$on("$ionicView.enter", function(event, data) {
      addressbookService.list(function(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};

        profileService.getTxps(50, function(err, txps) {
          $scope.fetchingProposals = false;
          if (err) {
            $log.error(err);
            return;
          }
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });

    $scope.openTxpModal = txpModalService.open;

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };
  });
