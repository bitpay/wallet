'use strict';

angular.module('copayApp.controllers').controller('advancedSettingsController', function($scope, $log,
    configService, platformInfo, externalLinkService, gettextCatalog) {
    $scope.isCordova = platformInfo.isCordova;
    var updateConfig = function() {
        var config = configService.getSync();

        $scope.spendUnconfirmed = {
            value: config.wallet.spendUnconfirmed
        };
        $scope.recentTransactionsEnabled = {
            value: config.recentTransactions.enabled
        };
        $scope.hideNextSteps = {
            value: config.hideNextSteps.enabled
        };

    };

    $scope.spendUnconfirmedChange = function() {
        var opts = {
            wallet: {
                spendUnconfirmed: $scope.spendUnconfirmed.value
            }
        };
        configService.set(opts, function(err) {
            if (err) $log.debug(err);
        });
    };

    $scope.nextStepsChange = function() {
        var opts = {
            hideNextSteps: {
                enabled: $scope.hideNextSteps.value
            },
        };
        configService.set(opts, function(err) {
            if (err) $log.debug(err);
        });
    };

    $scope.recentTransactionsChange = function() {
        var opts = {
            recentTransactions: {
                enabled: $scope.recentTransactionsEnabled.value
            }
        };
        configService.set(opts, function(err) {
            if (err) $log.debug(err);
        });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
        $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
        updateConfig();
    });
    $scope.removeCache = function() {
        if ('cordova' in window) {
            var success = function(status) {
                alert('Crear Cache succes.');
            };
            var error = function(status) {
                alert('Crear Cache fail.');
            };
            window.CacheClear(success, error);
            console.log(AppVersion, AppVersion.version);

        }
    };

});