'use strict';

var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('PaymentIntentController', function($rootScope, $scope, $routeParams, $timeout, $location, controllerUtils) {


  $rootScope.title = 'Select the wallet that you will use to spend your bitcoins';
  $scope.wallets = [];

  var wids = _.pluck($rootScope.iden.listWallets(), 'id');
  _.each(wids, function(wid) {
    var w = $rootScope.iden.getWalletById(wid);
    $scope.wallets.push(w);
    controllerUtils.updateBalance(w, function() {
      $rootScope.$digest();
    });
  });

  $scope.switchWallet = function(wid) {
    //go to send page
    controllerUtils.setPaymentWallet(wid);
  };

});
