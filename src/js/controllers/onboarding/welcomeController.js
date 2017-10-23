'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $timeout, $ionicConfig, $log,
    ongoingProcess, profileService, startupService, storageService) {

    $scope.$on("$ionicView.afterEnter", function() {
        startupService.ready();
    });

    $scope.$on("$ionicView.enter", function() {
        $ionicConfig.views.swipeBackEnabled(false);
    });

    $scope.$on("$ionicView.beforeLeave", function() {
        $ionicConfig.views.swipeBackEnabled(true);
    });

    $scope.createProfile = function() {
        $log.debug('Creating profile');
        profileService.createProfile(function(err) {
            if (err) $log.warn(err);
        });
    };

    var retryCount = 0;
    $scope.createDefaultWallet = function() {
        ongoingProcess.set('creatingWallet', true);
        $timeout(function() {
            profileService.createDefaultWallet(function(err, walletClient) {
                if (err) {
                    $log.warn(err);

                    return $timeout(function() {
                        $log.warn('Retrying to create default wallet.....:' + ++retryCount);
                        if (retryCount > 3) {
                            ongoingProcess.set('creatingWallet', false);
                            popupService.showAlert(
                                gettextCatalog.getString('Cannot Create Wallet'), err,
                                function() {
                                    retryCount = 0;
                                    return $scope.createDefaultWallet();
                                }, gettextCatalog.getString('Retry'));
                        } else {
                            return $scope.createDefaultWallet();
                        }
                    }, 2000);
                };
                ongoingProcess.set('creatingWallet', false);
                var wallet = walletClient;
                var walletId = wallet.credentials.walletId;

                $state.go('onboarding.collectEmail', {
                    walletId: walletId
                });

                /*
        $state.go('onboarding.backupRequest', {
          walletId: walletId
        });
          */
            });
        }, 300);
    };
});