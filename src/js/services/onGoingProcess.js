'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;
  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  var ongoingProcess = {};

  var processNames = {
    'broadcastingTx': gettext('Broadcasting transaction'),
    'calculatingFee': gettext('Calculating fee'),
    'connectingCoinbase': gettext('Connecting to Coinbase...'),
    'connectingGlidera': gettext('Connecting to Glidera...'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'creatingTx': gettext('Creating transaction'),
    'creatingWallet': gettext('Creating Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet information...'),
    'fetchingPayPro': gettext('Fetching payment information'),
    'generatingCSV': gettext('Generating .csv file...'),
    'gettingFeeLevels': gettext('Getting fee levels...'),
    'importingWallet': gettext('Importing Wallet...'),
    'joiningWallet': gettext('Joining Wallet...'),
    'recreating': gettext('Recreating Wallet...'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'retrievingInputs': gettext('Retrieving inputs information'),
    'scanning': gettext('Scanning Wallet funds...'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'validatingWords': gettext('Validating recovery phrase...'),
    'loadingTxInfo': gettext('Loading transaction info...'),
    'sendingFeedback': gettext('Sending feedback...'),
    'generatingNewAddress': gettext('Generating new address...'),
    'sendingByEmail': gettext('Preparing addresses...'),
    'sending2faCode': gettext('Sending 2FA code...'),
    'buyingBitcoin': gettext('Buying Nav Coin...'),
    'sellingBitcoin': gettext('Selling Nav Coin...'),
    'fetchingBitPayAccount': gettext('Fetching BitPay Account...'),
    'updatingGiftCards': 'Updating Gift Cards...',
    'updatingGiftCard': 'Updating Gift Card...',
    'cancelingGiftCard': 'Canceling Gift Card...',
    'creatingGiftCard': 'Creating Gift Card...',
    'buyingGiftCard': 'Buying Gift Card...',
    'topup': gettext('Top up in progress...')
  };

  root.clear = function() {
    ongoingProcess = {};
    if (isCordova && !isWindowsPhoneApp) {
      window.plugins.spinnerDialog.hide();
    } else {
      $ionicLoading.hide();
    }
  };

  root.get = function(processName) {
    return ongoingProcess[processName];
  };

  root.set = function(processName, isOn, customHandler) {
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

    if (customHandler) {
      customHandler(processName, showName, isOn);
    } else if (root.onGoingProcessName) {
      if (isCordova && !isWindowsPhoneApp) {
        window.plugins.spinnerDialog.show(null, showName, root.clear);
      } else {

        var tmpl;
        if (isWindowsPhoneApp) tmpl = '<div>' + showName + '</div>';
        else tmpl = '<div class="item-icon-left">' + showName + '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner></div>';
        $ionicLoading.show({
          template: tmpl
        });
      }
    } else {
      if (isCordova && !isWindowsPhoneApp) {
        window.plugins.spinnerDialog.hide();
      } else {
        $ionicLoading.hide();
      }
    }
  };

  return root;
});
