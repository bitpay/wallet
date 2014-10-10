'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('TransactionsController',
  function($scope, $rootScope, $timeout, controllerUtils, notification, rateService) {
    controllerUtils.redirIfNotComplete();


    var w = $rootScope.wallet;

    $scope.title = 'Transactions';
    $scope.loading = false;
    $scope.lastShowed = false;

    $scope.txpCurrentPage = 1;
    $scope.txpItemsPerPage = 4;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];

    var satToUnit = 1 / w.settings.unitToSatoshi;

    $scope.update = function() {
      $scope.loading = true;
      var from = ($scope.txpCurrentPage - 1) * $scope.txpItemsPerPage;
      var opts = {
        pending: false,
        skip: [from, from + $scope.txpItemsPerPage]
      };
      controllerUtils.updateTxs(opts);
      setTimeout(function() {
        $rootScope.$digest();
      }, 0);
    };

    $scope.show = function() {
      $scope.loading = true;
      setTimeout(function() {
        $scope.update();
      }, 10);
    };

    var _aggregateItems = function(items) {
      var w = $rootScope.wallet;
      if (!items) return [];

      var l = items.length;

      var ret = [];
      var tmp = {};
      var u = 0;

      for (var i = 0; i < l; i++) {

        var notAddr = false;
        // non standard input
        if (items[i].scriptSig && !items[i].addr) {
          items[i].addr = 'Unparsed address [' + u+++']';
          items[i].notAddr = true;
          notAddr = true;
        }

        // non standard output
        if (items[i].scriptPubKey && !items[i].scriptPubKey.addresses) {
          items[i].scriptPubKey.addresses = ['Unparsed address [' + u+++']'];
          items[i].notAddr = true;
          notAddr = true;
        }

        // multiple addr at output
        if (items[i].scriptPubKey && items[i].scriptPubKey.addresses.length > 1) {
          items[i].addr = items[i].scriptPubKey.addresses.join(',');
          ret.push(items[i]);
          continue;
        }

        var addr = items[i].addr || (items[i].scriptPubKey && items[i].scriptPubKey.addresses[0]);

        if (!tmp[addr]) {
          tmp[addr] = {};
          tmp[addr].valueSat = 0;
          tmp[addr].count = 0;
          tmp[addr].addr = addr;
          tmp[addr].items = [];
        }
        tmp[addr].isSpent = items[i].spentTxId;

        tmp[addr].doubleSpentTxID = tmp[addr].doubleSpentTxID || items[i].doubleSpentTxID;
        tmp[addr].doubleSpentIndex = tmp[addr].doubleSpentIndex || items[i].doubleSpentIndex;
        tmp[addr].unconfirmedInput += items[i].unconfirmedInput;
        tmp[addr].dbError = tmp[addr].dbError || items[i].dbError;
        tmp[addr].valueSat += parseInt((items[i].value * bitcore.util.COIN).toFixed(0));
        tmp[addr].items.push(items[i]);
        tmp[addr].notAddr = notAddr;
        tmp[addr].count++;
      }

      angular.forEach(tmp, function(v) {
        v.value = (parseInt(v.valueSat || 0).toFixed(0)) * satToUnit;
        rateService.whenAvailable(function() {
          var valueSat = v.value * w.settings.unitToSatoshi;
          v.valueAlt = rateService.toFiat(valueSat, w.settings.alternativeIsoCode);
        });
        ret.push(v);
      });
      return ret;
    };

    $scope.toogleLast = function() {
      $scope.lastShowed = !$scope.lastShowed;
      if ($scope.lastShowed) {
        $scope.getTransactions();
      }
    };

    $scope.getTransactions = function() {
      var w = $rootScope.wallet;
      $scope.loading = true;
      if (w) {
        var addresses = w.getAddressesStr();
        if (addresses.length > 0) {
          $scope.blockchain_txs = $scope.wallet.txCache || [];
          w.blockchain.getTransactions(addresses, function(err, txs) {
            if (err) throw err;

            $timeout(function() {
              $scope.blockchain_txs = [];
              for (var i = 0; i < txs.length; i++) {
                txs[i].vinSimple = _aggregateItems(txs[i].vin);
                txs[i].voutSimple = _aggregateItems(txs[i].vout);
                txs[i].valueOut = ((txs[i].valueOut * bitcore.util.COIN).toFixed(0)) * satToUnit;
                txs[i].fees = ((txs[i].fees * bitcore.util.COIN).toFixed(0)) * satToUnit;
                $scope.blockchain_txs.push(txs[i]);
              }
              $scope.wallet.txCache = $scope.blockchain_txs;
              $scope.loading = false;
            }, 10);
          });
        } else {
          $timeout(function() {
            $scope.loading = false;
            $scope.lastShowed = false;
          }, 1);
        }
      }
    };

    $scope.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    }

    $scope.getShortNetworkName = function() {
      return w.getNetworkName().substring(0, 4);
    };

    // Autoload transactions on 1-of-1
    if ($rootScope.wallet && $rootScope.wallet.totalCopayers == 1) {
      $scope.lastShowed = true;
      $scope.getTransactions();
    }

    $scope.amountAlternative = function (amount, txIndex, cb) {
      var w = $rootScope.wallet;
      rateService.whenAvailable(function() {
        var valueSat = amount * w.settings.unitToSatoshi;
        $scope.alternativeCurrency[txIndex] = rateService.toFiat(valueSat, w.settings.alternativeIsoCode);
        return cb ? cb() : null;
      });
    };
  });
