'use strict';

var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('PaymentIntentController', function($rootScope, $scope, $modal, controllerUtils) {

  $scope.wallets = [];

  var wids = _.pluck($rootScope.iden.listWallets(), 'id');
  _.each(wids, function(wid) {
    var w = $rootScope.iden.getWalletById(wid);
    if (w && w.isReady()) {
      $scope.wallets.push(w);
    }
  });

  $scope.open = function() {
    var modalInstance = $modal.open({
      templateUrl: 'myModalContent.html',
      controller: ModalInstanceCtrl,
      resolve: {
        items: function() {
          return $scope.wallets;
        }
      }
    });

    modalInstance.result.then(function(selectedItem) {}, function() {
      $rootScope.pendingPayment = null;
    });
  };


  // Please note that $modalInstance represents a modal window (instance) dependency.
  // It is not the same as the $modal service used above.

  var ModalInstanceCtrl = function($scope, $modalInstance, items, controllerUtils) {

    $scope.wallets = items;

    $scope.ok = function(selectedItem) {
      controllerUtils.setPaymentWallet(selectedItem);
      $modalInstance.close();
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  };

});
