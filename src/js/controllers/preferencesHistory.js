'use strict';

angular.module('copayApp.controllers').controller('preferencesHistory',
  function($scope, $log, $timeout, storageService, go, profileService, lodash) {
    var fc = profileService.focusedClient;
    var c = fc.credentials;
    $scope.csvReady = false;

    $scope.csvHistory = function(cb) {
      var allTxs = [];

      function getHistory(cb) {
        storageService.getTxHistory(c.walletId, function(err, txs) {
          if (err) return cb(err);

          var txsFromLocal = [];
          try {
            txsFromLocal = JSON.parse(txs);
          } catch (ex) {
            $log.warn(ex);
          }

          allTxs.push(txsFromLocal);
          return cb(null, lodash.flatten(allTxs));
        });
      };

      $log.debug('Generating CSV from History');
      getHistory(function(err, txs) {
        if (err || !txs) {
          $log.warn('Failed to generate CSV:', err);
          if (cb) return cb(err);
          return;
        }

        $log.debug('Wallet Transaction History Length:', txs.length);

        $scope.satToUnit = 1 / $scope.unitToSatoshi;
        var data = txs;
        var satToBtc = 1 / 100000000;
        $scope.csvContent = [];
        $scope.csvFilename = 'Copay-' + ($scope.alias || $scope.walletName) + '.csv';
        $scope.csvHeader = ['Date', 'Destination', 'Description', 'Amount', 'Currency', 'Txid', 'Creator', 'Copayers', 'Comment'];

        var _amount, _note, _copayers, _creator, _comment;
        data.forEach(function(it, index) {
          var amount = it.amount;

          if (it.action == 'moved')
            amount = 0;

          _copayers = '';
          _creator = '';

          if (it.actions && it.actions.length > 1) {
            for (var i = 0; i < it.actions.length; i++) {
              _copayers += it.actions[i].copayerName + ':' + it.actions[i].type + ' - ';
            }
            _creator = (it.creatorName && it.creatorName != 'undefined') ? it.creatorName : '';
          }
          _amount = (it.action == 'sent' ? '-' : '') + (amount * satToBtc).toFixed(8);
          _note = it.message || '';
          _comment = it.note ? it.note.body : '';

          if (it.action == 'moved')
            _note += ' Moved:' + (it.amount * satToBtc).toFixed(8)

          $scope.csvContent.push({
            'Date': formatDate(it.time * 1000),
            'Destination': it.addressTo || '',
            'Description': _note,
            'Amount': _amount,
            'Currency': 'BTC',
            'Txid': it.txid,
            'Creator': _creator,
            'Copayers': _copayers,
            'Comment': _comment
          });

          if (it.fees && (it.action == 'moved' || it.action == 'sent')) {
            var _fee = (it.fees * satToBtc).toFixed(8)
            $scope.csvContent.push({
              'Date': formatDate(it.time * 1000),
              'Destination': 'Bitcoin Network Fees',
              'Description': '',
              'Amount': '-' + _fee,
              'Currency': 'BTC',
              'Txid': '',
              'Creator': '',
              'Copayers': ''
            });
          }
        });

        $scope.csvReady = true;
        $timeout(function() {
          $scope.$apply();
        }, 100);

        if (cb)
          return cb();
        return;
      });

      function formatDate(date) {
        var dateObj = new Date(date);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError'
        }
        if (!dateObj.toJSON()) {
          return '';
        }

        return dateObj.toJSON();
      };
    };

    $scope.clearTransactionHistory = function() {
      storageService.removeTxHistory(c.walletId, function(err) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.$emit('Local/ClearHistory');

        $timeout(function() {
          go.walletHome();
        }, 100);
      });
    };
  });
