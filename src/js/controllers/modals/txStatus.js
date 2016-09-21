'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout, $state, $log, addressbookService) {

  if ($scope.cb) $timeout($scope.cb, 100);

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
  };

  $scope.save = function(addressbookEntry) {
    $scope.txStatusModal.hide();
    $state.go('tabs.send.addressbook', {
      fromSendTab: true,
      addressbookEntry: addressbookEntry
    })
  }

  addressbookService.list(function(err, ab) {
    if (err) $log.error(err);
    if (ab[$scope.tx.toAddress]) {
      $scope.entryExist = true;
      $log.debug('Entry already exist');
    }
  })

});
