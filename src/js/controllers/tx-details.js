'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $log, $ionicHistory, $scope, $timeout, walletService, lodash, gettextCatalog, profileService, externalLinkService, popupService, ongoingProcess, txFormatService, txConfirmNotification, blockExplorerService, configService) {

  var txId;
  var listeners = [];
  var serviceCounter;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    txId = data.stateParams.txid;
    $scope.title = gettextCatalog.getString('Transaction');
    $scope.wallet = profileService.getWallet(data.stateParams.walletId);
    $scope.color = $scope.wallet.color;
    $scope.copayerId = $scope.wallet.credentials.copayerId;
    $scope.isShared = $scope.wallet.credentials.n > 1;
    $scope.availableServices = configService.getDefaults().blockExplorerServices || null;
    $scope.loadingService = {};
    $scope.showError = false;
    serviceCounter = 0;

    txConfirmNotification.checkIfEnabled(txId, function(res) {
      $scope.txNotification = {
        value: res
      };
    });

    updateTx();

    listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') {
          updateTxDebounced({
            hideLoading: true
          });
        }
      })
    ];
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  function setLoading(name, state) {
    $scope.loadingService[name] = state;
    $timeout(function() {
      $scope.$apply();
    });
  };

  function compareTx() {
    if (lodash.isEmpty($scope.availableServices) || $scope.wallet.network == 'testnet') return;

    lodash.each($scope.availableServices, function(service) {
      setLoading(service.name, true);
      serviceCounter += 1;

      blockExplorerService.getTx(service, txId, function(err, params) {
        if (err) {
          setLoading(service.name, false);
          $log.warn('Could not get tx params from: ' + service.name);
          return;
        }
        compareAndUpdateParams(params);
      });
    });
  };

  function compareAndUpdateParams(params) {
    $log.debug('Comparing tx params from' + params.name);
    $log.debug('Amount:', params.amount);
    $log.debug('Address:', params.address);

    var matchAmount = $scope.btx.amount == params.amount;
    var matchAddress = lodash.find(params.address, function(addr) {
      return $scope.btx.addressTo == addr;
    });
    var isConfirmed = $scope.btx.confirmations > 0;
    var match = matchAmount && matchAddress;

    if (!isConfirmed && params.notFound) {
      setLoading(params.name, false);
      $log.warn('Could not get the tx params from: ' + params.name);
    } else if ((isConfirmed && params.notFound) || !match) {
      setLoading(params.name, false);
      $scope.showError = true;
    }

    params.isConfirmed = isConfirmed;
    params.match = match;
    lodash.each($scope.availableServices, function(service, i) {
      if (service.name == params.name)
        $scope.availableServices[i] = params;
    });

    setLoading(params.name, false);
    $timeout(function() {
      if ($scope.showError && serviceCounter == $scope.availableServices.length)
        return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('This transaction could not be verified on some third party block explorers'));
    });
  };

  function getDisplayAmount(amountStr) {
    return amountStr.split(' ')[0];
  }

  function getDisplayUnit(amountStr) {
    return amountStr.split(' ')[1];
  }

  function updateMemo() {
    walletService.getTxNote($scope.wallet, $scope.btx.txid, function(err, note) {
      if (err) {
        $log.warn('Could not fetch transaction note: ' + err);
        return;
      }
      if (!note) return;

      $scope.btx.note = note;
      $scope.$apply();
    });
  }

  function initActionList() {
    $scope.actionList = [];
    if ($scope.btx.action != 'sent' || !$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: $scope.btx.createdOn,
      description: actionDescriptions['created'],
      by: $scope.btx.creatorName
    });

    lodash.each($scope.btx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    $scope.actionList.push({
      type: 'broadcasted',
      time: $scope.btx.time,
      description: actionDescriptions['broadcasted'],
    });

    $timeout(function() {
      $scope.actionList.reverse();
    }, 10);
  }

  var updateTx = function(opts) {
    opts = opts || {};
    if (!opts.hideLoading) ongoingProcess.set('loadingTxInfo', true);
    walletService.getTx($scope.wallet, txId, function(err, tx) {
      if (!opts.hideLoading) ongoingProcess.set('loadingTxInfo', false);
      if (err) {
        $log.warn('Error getting transaction: ' + err);
        $ionicHistory.goBack();
        return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not available at this time'));
      }

      $scope.btx = txFormatService.processTx(tx);
      txFormatService.formatAlternativeStr(tx.fees, function(v) {
        $scope.btx.feeFiatStr = v;
        $scope.btx.feeRateStr = ($scope.btx.fees / ($scope.btx.amount + $scope.btx.fees) * 100).toFixed(2) + '%';
      });

      if ($scope.btx.action != 'invalid') {
        if ($scope.btx.action == 'sent') $scope.title = gettextCatalog.getString('Sent Funds');
        if ($scope.btx.action == 'received') $scope.title = gettextCatalog.getString('Received Funds');
        if ($scope.btx.action == 'moved') $scope.title = gettextCatalog.getString('Moved Funds');
      }

      $scope.displayAmount = getDisplayAmount($scope.btx.amountStr);
      $scope.displayUnit = getDisplayUnit($scope.btx.amountStr);

      compareTx();
      updateMemo();
      initActionList();
      getFiatRate();
      $timeout(function() {
        $scope.$digest();
      });

      feeService.getFeeLevels(function(err, levels) {
        if (err) return;
        walletService.getLowAmount($scope.wallet, levels, function(err, amount) {
          if (err) return;
          $scope.btx.lowAmount = tx.amount < amount;

          $timeout(function() {
            $scope.$apply();
          });

        });
      });
    });
  };

  var updateTxDebounced = lodash.debounce(updateTx, 5000);

  $scope.showCommentPopup = function() {
    var opts = {};
    if ($scope.btx.message) {
      opts.defaultText = $scope.btx.message;
    }
    if ($scope.btx.note && $scope.btx.note.body) opts.defaultText = $scope.btx.note.body;

    popupService.showPrompt($scope.wallet.name, gettextCatalog.getString('Memo'), opts, function(text) {
      if (typeof text == "undefined") return;

      $scope.btx.note = {
        body: text
      };
      $log.debug('Saving memo');

      var args = {
        txid: $scope.btx.txid,
        body: text
      };

      walletService.editTxNote($scope.wallet, args, function(err, res) {
        if (err) {
          $log.debug('Could not save tx comment ' + err);
        }
      });
    });
  };

  $scope.viewOnBlockchain = function() {
    var btx = $scope.btx;
    var url = 'https://' + ($scope.getShortNetworkName() == 'test' ? 'test-' : '') + 'insight.bitpay.com/tx/' + btx.txid;
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('View Transaction on Insight');
    var okText = gettextCatalog.getString('Open Insight');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.getShortNetworkName = function() {
    var n = $scope.wallet.credentials.network;
    return n.substring(0, 4);
  };

  var getFiatRate = function() {
    $scope.alternativeIsoCode = $scope.wallet.status.alternativeIsoCode;
    $scope.wallet.getFiatRate({
      code: $scope.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        $scope.rateDate = res.fetchedOn;
        $scope.rate = res.rate;
      }
    });
  };

  $scope.txConfirmNotificationChange = function() {
    if ($scope.txNotification.value) {
      txConfirmNotification.subscribe($scope.wallet, {
        txid: txId
      });
    } else {
      txConfirmNotification.unsubscribe($scope.wallet, txId);
    }
  };

});
