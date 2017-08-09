'use strict';
angular.module('copayApp.controllers').controller('paymentUriController',
  function($rootScope, $scope, $stateParams, $location, $timeout, $ionicHistory, profileService, configService, lodash, bitcore, $state) {
    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    };

    // Build paymentURI with querystring
    this.init = function() {
      var query = [];
      this.paymentURI = $stateParams.url;

      var URI = bitcore.URI;
      var isUriValid = URI.isValid(this.paymentURI);
      if (!URI.isValid(this.paymentURI)) {
        this.error = true;
        return;
      }
      var uri = new URI(this.paymentURI);

      if (uri && uri.address) {
        var configWallet = configService.getSync().wallet.settings;
        var configNetwork = configService.getSync().currencyNetworks['livenet/btc']; // Support only livenet/btc

        var unitToAtomicUnit = configNetwork.unitToAtomicUnit;
        var atomicToUnit = 1 / unitToAtomicUnit;
        var unitName = configNetwork.unitName;

        if (uri.amount) {
          uri.amount = strip(uri.amount * atomicToUnit) + ' ' + unitName;
        }
        uri.network = uri.address.network.name;
        this.uri = uri;
      }
    };

    this.getWallets = function(network) {

      $scope.wallets = [];
      lodash.forEach(profileService.getWallets(network), function(w) {
        var client = profileService.getClient(w.id);
        profileService.isReady(client, function(err) {
          if (err) return;
          $scope.wallets.push(w);
        })
      });
    };

    this.selectWallet = function(wid) {
      var self = this;
      profileService.setAndStoreFocus(wid, function() {});
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
      $timeout(function() {
        $rootScope.$emit('paymentUri', self.paymentURI);
      }, 1000);
    };
  });
