'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  var ongoingProcess = {};

  var processNames = {
    'scanning': gettext('Scanning Wallet funds...'),
    'recreating': gettext('Recreating Wallet...'),
    'generatingCSV': gettext('Generating .csv file...'),
    'creatingTx': gettext('Creating transaction'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'broadcastingTx': gettext('Broadcasting transaction'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'fetchingPayPro': gettext('Fetching Payment Information'),
    'calculatingFee': gettext('Calculating fee'),
    'joiningWallet': gettext('Joining Wallet...'),
    'retrivingInputs': gettext('Retrieving inputs information'),
    'creatingWallet': gettext('Creating Wallet...'),
    'validatingWallet': gettext('Validating wallet integrity...'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'validatingWords': gettext('Validating recovery phrase...'),
    'connectingCoinbase': gettext('Connecting to Coinbase...'),
    'connectingGlidera': gettext('Connecting to Glidera...'),
    'importingWallet': gettext('Importing Wallet...'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet Information...'),
  };

  root.clear = function() {
    ongoingProcess = {};
    if (isCordova) {
      window.plugins.spinnerDialog.hide();
    } else {
      $ionicLoading.hide();
    }
  };

  root.get = function(processName) {
    return ongoingProcess[processName];
  };

  root.set = function(processName, isOn) {
    $log.debug('ongoingProcess', processName, isOn);
    root[processName] = isOn;
    ongoingProcess[processName] = isOn;

    var name;
    root.any = lodash.any(ongoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    root.onGoingProcessName = name;

    var showName = $filter('translate')(processNames[name] || name);

    if (root.onGoingProcessName) {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, showName, true);
      } else {

        var tmpl = '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner>' + showName;
        $ionicLoading.show({
          template: tmpl
        });
      }
    } else {
      if (isCordova) {
        window.plugins.spinnerDialog.hide();
      } else {
        $ionicLoading.hide();
      }
    }
  };

  return root;
});
