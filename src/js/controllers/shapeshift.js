'use strict';

angular.module('copayApp.controllers').controller('shapeshiftController',
  function($rootScope, $scope, $timeout, $log, $ionicScrollDelegate, lodash, shapeshiftService, externalLinkService) {

    var listeners = [];
    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var updateShift = lodash.debounce(function(shifts) {
      if (lodash.isEmpty(shifts.data)) return;
      lodash.forEach(shifts.data, function(dataFromStorage) {
        if (dataFromStorage.status == 'complete') return;
        shapeshiftService.getStatus(dataFromStorage.address, function(err, st) {
          if (err) return;

          $scope.shifts.data[st.address]['status'] = st.status;
          shapeshiftService.saveShapeshift($scope.shifts.data[st.address], null, function(err) {
            $log.debug("Saved shift with status: " + st.status);
          });
          $timeout(function() {
            $scope.$digest();
          }, 100);
        });
      });
    }, 1000, {
      'leading': true
    });


    var init = function() {
      shapeshiftService.getShapeshift(function(err, ss) {
        if (err) $log.error(err);

        $scope.shifts = { data: ss };
        $timeout(function() {
          updateShift($scope.shifts);
          $scope.$digest();
          $ionicScrollDelegate.resize();
        }, 1000);
      });
    };

    $scope.update = function() {
      updateShift($scope.shifts);
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.network = shapeshiftService.getNetwork();
      $scope.shifts = { data: {} };

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type) {
          if (type == 'NewBlock') updateShift($scope.shifts);
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
