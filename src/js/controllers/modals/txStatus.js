'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout, $state, $ionicHistory, $log, addressbookService) {

  if ($scope.cb) $timeout($scope.cb, 100);
  $scope.fromSendTab = $ionicHistory.viewHistory().backView && $ionicHistory.viewHistory().backView.stateName === "tabs.send.amount" ||  "tabs.send";

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
    if ($scope.fromSendTab) {
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    }
  };

  $scope.save = function(addressbookEntry) {
    $scope.txStatusModal.hide();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $ionicHistory.removeBackView();
    $state.go('tabs.send.addressbook', {
      fromSendTab: true,
      addressbookEntry: addressbookEntry
    });
  }

  addressbookService.list(function(err, ab) {
    if (err) $log.error(err);
    if (ab[$scope.tx.toAddress]) {
      $scope.entryExist = true;
      $log.debug('Entry already exist');
    }
  })

});
