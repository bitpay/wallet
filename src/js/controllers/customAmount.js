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

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }
      
      $scope.address = addr;
    
      var parsedAmount = txFormatService.parseAmount(
        data.stateParams.amount, 
        data.stateParams.currency);

      $scope.amountUnitStr = parsedAmount.amountUnitStr;
      $scope.amountBtc = parsedAmount.amount; // BTC
      $scope.altAmountStr = txFormatService.formatAlternativeStr(parsedAmount.amountSat, CUSTOMNETWORKS[$scope.network]);

      console.log($scope.network, parsedAmount, $scope.altAmountStr)
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
    var data = $scope.network + ':' + $scope.address + '?amount=' + $scope.amountBtc;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return $scope.network + ':' + $scope.address + '?amount=' + $scope.amountBtc;
  };

});
