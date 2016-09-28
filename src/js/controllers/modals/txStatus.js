'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout, $state, $stateParams, $ionicHistory, $log, addressbookService) {

  if ($scope.cb) $timeout($scope.cb, 100);

  var previousView = $ionicHistory.viewHistory().backView && $ionicHistory.viewHistory().backView.stateName;
  $scope.fromSendTab = previousView.match(/tabs.send/) ? true : false;
  $scope.fromBitPayCard = previousView.match(/tabs.bitpayCard/) ? true : false;
  $scope.fromPayPro = $stateParams.paypro ? true : false;

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
    if ($scope.fromSendTab) {
      $ionicHistory.removeBackView();
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.home');
      }, 100);
    } else if ($scope.fromBitPayCard) {
      $ionicHistory.removeBackView();
      $timeout(function() {
        $state.transitionTo('tabs.bitpayCard');
      }, 100);
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
      fromSendTab: $scope.fromSendTab,
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
