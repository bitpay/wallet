'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $ionicHistory, txFormatService, platformInfo, configService, profileService, walletService, popupService, CUSTOMNETWORKS) {

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
    $scope.network = $scope.wallet.network;
    if($scope.network === "livenet") {$scope.network = "bitcoin";}
    console.log('the fuck')
    walletService.getAddress($scope.wallet, false, function(err, addr) {
      console.log('hasdflkjasdfjkh')
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }
      
      $scope.address = addr;
    
      var parsedAmount = txFormatService.parseAmount(
        data.stateParams.amount, 
        data.stateParams.currency);

      $scope.amountBtc = amount; // BTC
      $scope.altAmountStr = txFormatService.formatAlternativeStr(parsedAmount.amountSat, CUSTOMNETWORKS[$scope.network]);


      // Amount in USD or BTC
      // var amount = parsedAmount.amount;
      // var currency = parsedAmount.currency;
      // $scope.amountUnitStr = parsedAmount.amountUnitStr;

      // if (currency != 'BTC') {
      //   // Convert to BTC
      //   var config = configService.getSync().wallet.settings;
      //   var amountUnit = txFormatService.satToUnit(parsedAmount.amountSat);
      //   var btcParsedAmount = txFormatService.parseAmount(amountUnit, config.unitName);
        
      //   $scope.amountBtc = btcParsedAmount.amount;
      //   $scope.altAmountStr = btcParsedAmount.amountUnitStr;
      // } else {
      //   $scope.amountBtc = amount; // BTC
      //   $scope.altAmountStr = txFormatService.formatAlternativeStr(parsedAmount.amountSat, CUSTOMNETWORKS[$scope.network]);
      // }
    });

    $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.amount, CUSTOMNETWORKS[$scope.network]);

  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack(-2);
  };

  $scope.shareAddress = function() {
    if (!platformInfo.isCordova) return;
    var data = $scope.network + ':' + $scope.address + '?amount=' + $scope.amountBtc;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return $scope.network + ':' + $scope.address + '?amount=' + $scope.amountBtc;
  };

});
