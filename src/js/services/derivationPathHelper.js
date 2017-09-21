'use strict';

angular.module('copayApp.services').factory('derivationPathHelper', ['lodash', 'customNetworks', function(lodash, customNetworks) {
  var root = {};

  root.default = "m/44'/0'/0'";
  root.defaultTestnet = "m/44'/1'/0'";

  root.getDefault = function(networkName) {
    return customNetworks.getAll().then(function(CUSTOMNETWORKS) {
      for (var i in CUSTOMNETWORKS) {
        if(i === networkName) {
          return "m/44'/"+CUSTOMNETWORKS[i].derivationCoinPath+"'/0'";
        }
      }
      return null;      
    })
  }


  root.parse = function(str) {
    return customNetworks.getAll().then(function(CUSTOMNETWORKS) {
      var arr = str.split('/');

      var ret = {};

      if (arr[0] != 'm')
        return false;

      switch (arr[1]) {
        case "44'":
          ret.derivationStrategy = 'BIP44';
          break;
        case "45'":
          return {
            derivationStrategy: 'BIP45',
            networkName: 'livenet',
            account: 0,
          }
          break;
        case "48'":
          ret.derivationStrategy = 'BIP48';
          break;
        default:
          return false;
      };

      ret.networkName = '';

      for(var i in CUSTOMNETWORKS) {
        if(CUSTOMNETWORKS[i].derivationCoinPath+"'" === arr[2]) {
          ret.networkName = CUSTOMNETWORKS[i].name
        }
      }

      var match = arr[3].match(/(\d+)'/);
      if (!match)
        return false;
      ret.account = +match[1]
      return ret;
    })
  };

  return root;
}]);
