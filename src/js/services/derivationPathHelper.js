'use strict';

angular.module('copayApp.services').factory('derivationPathHelper', function(lodash, networkHelper) {
  var root = {};

  var defaultPath = "m/44'/0'/0'";
  var defaultTestnetPath = "m/44'/1'/0'";

  root.getPath = function(network) {
    if (networkHelper.isTestnet(network.net)) {
      return defaultTestnetPath;
    } else {
      return defaultPath;
    }
  };

  root.parse = function(str, network) {
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
          networkName: networkHelper.getName(networkHelper.getLivenetForChain(network.chain)),
          account: 0,
        }
        break;
      case "48'":
        ret.derivationStrategy = 'BIP48';
        break;
      default:
        return false;
    };

    switch (arr[2]) {
      case "0'":
          ret.networkName = networkHelper.getName(networkHelper.getLivenetForChain(network.chain));
        break;
      case "1'":
          ret.networkName = networkHelper.getName(networkHelper.getTestnetForChain(network.chain));
        break;
      default:
        return false;
    };

    var match = arr[3].match(/(\d+)'/);
    if (!match)
      return false;
    ret.account = +match[1]

    return ret;
  };

  return root;
});
