'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, lodash, $ionicLoading, gettextCatalog, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  var ongoingProcess = {};

  var processNames = {
    'openingWallet': 'Updating Wallet...',
    'updatingStatus': 'Updating Wallet...',
    'updatingBalance': 'Updating Wallet...',
    'updatingPendingTxps': 'Updating Wallet...',
    'scanning': 'Scanning Wallet funds...',
    'recreating': 'Recreating Wallet...',
    'generatingCSV': 'Generating .csv file...',
    'creatingTx': 'Creating transaction',
    'sendingTx': 'Sending transaction',
    'signingTx': 'Signing transaction',
    'broadcastingTx': 'Broadcasting transaction',
    'fetchingPayPro': 'Fetching Payment Information',
    'calculatingFee': 'Calculating fee',
    'joiningWallet': 'Joining Wallet...',
    'retrivingInputs': 'Retrieving inputs information',
    'creatingWallet': 'Creating Wallet...',
    'validatingWallet': 'Validating wallet integrity...',
    'connectingledger': 'Waiting for Ledger...',
    'connectingtrezor': 'Waiting for Trezor...',
    'validatingWords': 'Validating recovery phrase...',
    'connectingCoinbase': 'Connecting to Coinbase...',
    'connectingGlidera': 'Connecting to Glidera...',
    'importingWallet': 'Importing Wallet...',
    'sweepingWallet': 'Sweeping Wallet...',
    'deletingWallet': 'Deleting Wallet...',
  };

  lodash.each(processNames, function(k, v) {
    processNames[k] = gettextCatalog.getString(v);
  });

  root.clear = function() {
    ongoingProcess = {};
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

    var showName = processNames[name] || gettextCatalog.getString(name);
    if (root.onGoingProcessName) {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, showName, true);
      } else {
        $ionicLoading.show({
          template: showName,
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
