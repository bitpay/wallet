'use strict';

angular.module('copayApp.services').factory('walletNameLookupService', function ($http) {
  var root = {};

  root.getWalletName = function (wallet_name) {
    var promise = $http({
      url: config.walletNameLookup.url + wallet_name + '/btc',
      method: 'GET',
      headers: {'Content-Type': 'application/json'}
    }).then(function (response) {
      if (response.status == "200" && response.data.success) {
        return {isError: false, walletAddress: response.data.wallet_address};
      }
      return {isError: true, message: 'Wallet Name not found'};
    }, function (err) {
      return {isError: true, message: 'Wallet Name lookup failed'};
    });
    return promise;
  };
  return root
});