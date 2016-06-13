'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, lodash, $ionicLoading, gettextCatalog, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  var ongoingProcess = {};

  var processNames = {
    'openingWallet': gettextCatalog.getString('Updating Wallet...'),
    'updatingStatus': gettextCatalog.getString('Updating Wallet...'),
    'updatingBalance': gettextCatalog.getString('Updating Wallet...'),
    'updatingPendingTxps': gettextCatalog.getString('Updating Wallet...'),
    'scanning': gettextCatalog.getString('Scanning Wallet funds...'),
    'recreating': gettextCatalog.getString('Recreating Wallet...'),
    'generatingCSV': gettextCatalog.getString('Generating .csv file...'),
    'creatingTx': gettextCatalog.getString('Creating transaction'),
    'sendingTx': gettextCatalog.getString('Sending transaction'),
    'signingTx': gettextCatalog.getString('Signing transaction'),
    'broadcastingTx': gettextCatalog.getString('Broadcasting transaction'),
    'fetchingPayPro': gettextCatalog.getString('Fetching Payment Information'),
    'calculatingFee': gettextCatalog.getString('Calculating fee'),
    'joiningWallet': gettextCatalog.getString('Joining Wallet...'),
    'retrivingInputs': gettextCatalog.getString('Retrieving inputs information'),
    'creatingWallet': gettextCatalog.getString('Creating Wallet...'),
    'validatingWallet': gettextCatalog.getString('Validating wallet integrity...'),
    'connectingledger': gettextCatalog.getString('Waiting for Ledger...'),
    'connectingtrezor': gettextCatalog.getString('Waiting for Trezor...'),
    'validatingWords': gettextCatalog.getString('Validating recovery phrase...'),
    'connectingCoinbase': gettextCatalog.getString('Connecting to Coinbase...'),
    'connectingGlidera': gettextCatalog.getString('Connecting to Glidera...'),
    'importingWallet': gettextCatalog.getString('Importing Wallet...'),
    'sweepingWallet': gettextCatalog.getString('Sweeping Wallet...'),
    'deletingWallet': gettextCatalog.getString('Deleting Wallet...'),
  };

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
