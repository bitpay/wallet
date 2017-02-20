'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $rootScope, $timeout, $interval, $log, ongoingProcess, platformInfo, $ionicScrollDelegate, txFormatService, bwcError, gettextCatalog, lodash, walletService, popupService, $ionicHistory) {
  var isGlidera = $scope.isGlidera;
  var GLIDERA_LOCK_TIME = 6 * 60 * 60;
  var now = Math.floor(Date.now() / 1000);
  var countDown;

  $scope.init = function() {
    $scope.loading = null;
    $scope.isCordova = platformInfo.isCordova;
    $scope.copayerId = $scope.wallet.credentials.copayerId;
    $scope.isShared = $scope.wallet.credentials.n > 1;
    $scope.canSign = $scope.wallet.canSign() || $scope.wallet.isPrivKeyExternal();
    $scope.color = $scope.wallet.color;
    $scope.data = {};
    $scope.displayAmount = getDisplayAmount($scope.tx.amountStr);
    $scope.displayUnit = getDisplayUnit($scope.tx.amountStr);
    initActionList();
    checkPaypro();
    applyButtonText();
  };

  function applyButtonText() {
    $scope.buttonText = $scope.isCordova ? gettextCatalog.getString('Slide') + ' ' : gettextCatalog.getString('Click') + ' ';

    var lastSigner = lodash.filter($scope.tx.actions, {
      type: 'accept'
    }).length == $scope.tx.requiredSignatures - 1;

    if (lastSigner)
      $scope.buttonText += gettextCatalog.getString('to send');
    else
      $scope.buttonText += gettextCatalog.getString('to accept');
  };

  function getDisplayAmount(amountStr) {
    return amountStr.split(' ')[0];
  };

  function getDisplayUnit(amountStr) {
    return amountStr.split(' ')[1];
  };

  function initActionList() {
    $scope.actionList = [];

    if (!$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: $scope.tx.createdOn,
      description: actionDescriptions['created'],
      by: $scope.tx.creatorName
    });

    lodash.each($scope.tx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    $timeout(function() {
      $scope.actionList.reverse();
    }, 10);
  };

  function checkPaypro() {
    if ($scope.tx.payProUrl && !platformInfo.isChromeApp) {
      $scope.wallet.fetchPayPro({
        payProUrl: $scope.tx.payProUrl,
      }, function(err, paypro) {
        if (err) return;
        $scope.tx.paypro = paypro;
        paymentTimeControl($scope.tx.paypro.expires);
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 10);
      });
    }
  };

  function paymentTimeControl(expirationTime) {
    $scope.paymentExpired = false;
    setExpirationTime();

    countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        $scope.paymentExpired = true;
        if (countDown) $interval.cancel(countDown);
        return;
      }
      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };
  };

  $scope.$on('accepted', function(event) {
    $scope.sign();
  });

  // ToDo: use tx.customData instead of tx.message
  if ($scope.tx.message === 'Glidera transaction' && isGlidera) {
    $scope.tx.isGlidera = true;
    if ($scope.tx.canBeRemoved) {
      $scope.tx.canBeRemoved = (Date.now() / 1000 - ($scope.tx.ts || $scope.tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  var setError = function(err, prefix) {
    $scope.sendStatus = '';
    $scope.loading = false;
    popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err, prefix));
  };

  $scope.sign = function(onSendStatusChange) {
    $scope.loading = true;
    walletService.publishAndSign($scope.wallet, $scope.tx, function(err, txp) {
      $scope.$emit('UpdateTx');
      if (err) return setError(err, gettextCatalog.getString('Could not send payment'));
      success();
    }, onSendStatusChange);
  };

  $scope.reject = function(txp) {
    var title = gettextCatalog.getString('Warning!');
    var msg = gettextCatalog.getString('Are you sure you want to reject this transaction?');
    popupService.showConfirm(title, msg, null, null, function(res) {
      if (res) {
        $scope.loading = true;

        walletService.reject($scope.wallet, $scope.tx, function(err, txpr) {
          if (err)
            return setError(err, gettextCatalog.getString('Could not reject payment'));

          $scope.close();
        });
      }
    });
  };

  $scope.remove = function() {
    var title = gettextCatalog.getString('Warning!');
    var msg = gettextCatalog.getString('Are you sure you want to remove this transaction?');
    popupService.showConfirm(title, msg, null, null, function(res) {
      if (res) {
        ongoingProcess.set('removeTx', true);
        walletService.removeTx($scope.wallet, $scope.tx, function(err) {
          ongoingProcess.set('removeTx', false);

          // Hacky: request tries to parse an empty response
          if (err && !(err.message && err.message.match(/Unexpected/))) {
            $scope.$emit('UpdateTx');
            return setError(err, gettextCatalog.getString('Could not delete payment proposal'));
          }

          $scope.close();
        });
      }
    });
  };

  $scope.broadcast = function(txp) {
    $scope.loading = true;

    $timeout(function() {
      ongoingProcess.set('broadcastingTx', true);
      walletService.broadcastTx($scope.wallet, $scope.tx, function(err, txpb) {
        ongoingProcess.set('broadcastingTx', false);

        if (err) {
          return setError(err, gettextCatalog.getString('Could not broadcast payment'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.getShortNetworkName = function() {
    return $scope.wallet.credentials.networkName.substring(0, 4);
  };

  var updateTxInfo = function(eventName) {
    $scope.wallet.getTx($scope.tx.id, function(err, tx) {
      if (err) {
        if (err.message && err.message == 'Transaction proposal not found' &&
          (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
          $scope.tx.removed = true;
          $scope.tx.canBeRemoved = false;
          $scope.tx.pendingForUs = false;
          $scope.$apply();
        }
        return;
      }

      var action = lodash.find(tx.actions, {
        copayerId: $scope.wallet.credentials.copayerId
      });

      $scope.tx = txFormatService.processTx(tx);

      if (!action && tx.status == 'pending')
        $scope.tx.pendingForUs = true;

      $scope.updateCopayerList();
      initActionList();
      $scope.$apply();
    });
  };

  var bwsEvent = $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
    lodash.each([
        'TxProposalRejectedBy',
        'TxProposalAcceptedBy',
        'transactionProposalRemoved',
        'TxProposalRemoved',
        'NewOutgoingTx',
        'UpdateTx'
    ], function(eventName) {
      if (walletId == $scope.wallet.id && type == eventName) {
        updateTxInfo(eventName);
      }
    });
  });

  $scope.updateCopayerList = function() {
    lodash.map($scope.copayers, function(cp) {
      lodash.each($scope.tx.actions, function(ac) {
        if (cp.id == ac.copayerId) {
          cp.action = ac.type;
        }
      });
    });
  };

  function statusChangeHandler(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (showName) {
      $scope.sendStatus = showName;
    }
  }

  function success() {
    $scope.sendStatus = 'success';
    $scope.$digest();
  }

  $scope.statusChangeHandler = statusChangeHandler;

  $scope.onConfirm = function() {
    $scope.sign(statusChangeHandler);
  };

  $scope.onSuccessConfirm = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $scope.close();
  };

  $scope.close = function() {
    bwsEvent();
    $scope.loading = null;
    $scope.txpDetailsModal.hide();
  };
});
