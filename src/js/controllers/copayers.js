'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $timeout, $stateParams, $state, $rootScope, $ionicHistory, appConfigService, lodash, profileService, walletService, popupService, bwcError, platformInfo, gettextCatalog, ongoingProcess, pushNotificationsService) {

    var listener;
    var appName = appConfigService.userVisibleName;
    var appUrl = appConfigService.url;

    $scope.isCordova = platformInfo.isCordova;
    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.wallet = profileService.getWallet(data.stateParams.walletId);
      updateWallet();
      $scope.shareIcon = platformInfo.isIOS ? 'iOS' : 'Android';
    
      listener = $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        if ($scope.wallet && walletId == $scope.wallet.id && type == ('NewCopayer' || 'WalletComplete'))
          updateWalletDebounced();
      });
    }); 

    $scope.$on("$ionicView.leave", function(event, data) {
      listener();
    });

    var updateWallet = function() {
      $log.debug('Updating wallet:' + $scope.wallet.name)
      walletService.getStatus($scope.wallet, {}, function(err, status) {
        if (err) {
          return popupService.showAlert(bwcError.msg(err, gettextCatalog.getString('Could not update wallet')));
        }
        $scope.wallet.status = status;
        $scope.copayers = $scope.wallet.status.wallet.copayers;
        $scope.secret = $scope.wallet.status.wallet.secret;
        $timeout(function() {
          $scope.$apply();
        });
        if (status.wallet.status == 'complete') {
          $scope.wallet.openWallet(function(err, status) {
            if (err) $log.error(err);
            $scope.clearNextView();
            $state.go('tabs.home').then(function() {
              $state.transitionTo('tabs.wallet', {
                walletId: $scope.wallet.credentials.walletId
              });
            });
          });
        }
      });
    };

    var updateWalletDebounced = lodash.debounce(updateWallet, 5000, true);

    $scope.showDeletePopup = function() {
      var title = gettextCatalog.getString('Confirm');
      var msg = gettextCatalog.getString('Are you sure you want to cancel and delete this wallet?');
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient($scope.wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          pushNotificationsService.unsubscribe($scope.wallet);
          $scope.clearNextView();
          $state.go('tabs.home');
        }
      });
    };

    $scope.copySecret = function() {
      if ($scope.isCordova) {
        window.cordova.plugins.clipboard.copy($scope.secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    $scope.shareSecret = function() {
      if ($scope.isCordova) {
        var message = gettextCatalog.getString('Join my {{appName}} Wallet. Here is the invitation code: {{secret}} You can download {{appName}} for your phone or desktop at {{appUrl}}', {
          secret: $scope.secret,
          appName: appName,
          appUrl: appUrl
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a {{appName}} Wallet', {
          appName: appName
        }), null, null);
      }
    };

    $scope.clearNextView = function() {
      listener(); // remove listener
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory(); 
    };

  });
