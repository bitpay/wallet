'use strict';

angular.module('copay.send').controller('SendController',
  function($scope, $rootScope, $location, Socket, controllerUtils) {
    $scope.title = 'Send';

    $scope.unitIds = ['BTC','mBTC'];
    $scope.selectedUnit = $scope.unitIds[0];

    if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }
    else {
      controllerUtils.handleTransactionByAddress($scope); 
    }

    $scope.submitForm = function(form) {
      if (form.$invalid) {
        $rootScope.flashMessage = { message: 'You can not send a proposal transaction. Please, try again', type: 'error'};
        return;
      }

      if ($rootScope.totalBalance <= form.amount.$modelValue) {
        $rootScope.flashMessage = { message: 'You have not enough amount to send', type: 'error'};
        return;
      }

      var address = form.address.$modelValue;
      var amount = (form.amount.$modelValue * 100000000).toString(); // satoshi to string

      var w = $rootScope.wallet;
      w.createTx( address, amount,function() {
        $rootScope.$digest();
      });
     
      // reset fields
      $scope.address = null;
      $scope.amount = null;
      form.address.$pristine = true;
      form.amount.$pristine = true;

      // TODO: check if createTx has an error.
      $rootScope.flashMessage = { message: 'Your transaction proposal has been sent successfully', type: 'success'};
		};

  });
