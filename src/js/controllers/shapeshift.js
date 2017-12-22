'use strict';

angular.module('copayApp.controllers').controller('shapeshiftController',
  function($rootScope, $scope, $timeout, $log, $ionicScrollDelegate, lodash, shapeshiftService, externalLinkService) {

    var listeners = [];
    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var updateShift = function(shifts) {
      if (lodash.isEmpty(shifts.data)) return;
      lodash.forEach(shifts.data, function(dataFromStorage) {
        shapeshiftService.getStatus(dataFromStorage.address, function(err, st) {
          if (err) return;

          $scope.shifts.data[st.address]['status'] = st.status;
          $timeout(function() {
            $scope.$digest();
          }, 100);
        });
      });
    };


    var init = function() {
      shapeshiftService.getShapeshift(function(err, ss) {
        if (err) $log.error(err);

        $scope.shifts = { data: ss };
        updateShift($scope.shifts);
        $timeout(function() {
          $scope.$digest();
          $ionicScrollDelegate.resize();
        });
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.network = shapeshiftService.getNetwork();
      $scope.shifts = { data: {} };

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId) {
          if (e.type == 'NewBlock') updateShift($scope.shifts);
        })
      ];

      init();
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });
  });
