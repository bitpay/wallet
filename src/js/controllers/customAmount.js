'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $ionicHistory, txFormatService, platformInfo, configService, profileService, walletService, popupService, networkService) {

  var showErrorAndBack = function(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var walletId = data.stateParams.id;

    if (!walletId) {
      showErrorAndBack('Error', 'No wallet selected');
      return;
    }
      
    $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

    $scope.wallet = profileService.getWallet(walletId);

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }
      
      $scope.address = addr;
    
      var parsedAmount = txFormatService.parseAmount(
        $scope.wallet.network,
        data.stateParams.amount, 
        data.stateParams.currency);

      var amount = parsedAmount.amount;
      var currency = parsedAmount.currency;
      $scope.amountAtomicStr = parsedAmount.amountAtomicStr;

      var standardUnit = networkService.getStandardUnit($scope.wallet.network);

      if (currency != standardUnit.shortName) {
        // Convert to standard units
        var config = configService.getSync().currencyNetworks[$scope.wallet.network];

        var amountAtomic = txFormatService.atomicToUnit($scope.wallet.network, parsedAmount.amountAtomic);
        var stanardParsedAmount = txFormatService.parseAmount($scope.wallet.network, amountAtomic, config.unitName);
        
        $scope.amountStandard = standardParsedAmount.amount;
        $scope.altAmountStr = standardParsedAmount.amountAtomicStr;
      } else {
        $scope.amountStandard = amount;
        $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.network, parsedAmount.amountAtomic);
      }
    });
  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack(-2);
  };

  $scope.shareAddress = function() {
    if (!platformInfo.isCordova) return;
    var data = 'bitcoin:' + $scope.address + '?amount=' + $scope.amountStandard; // TODO - protocol
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return 'bitcoin:' + $scope.address + '?amount=' + $scope.amountStandard; // TODO - protocol
  };

});
