/**
 * Created by one on 14/07/16.
 */
'use strict';

angular.module('copayApp.controllers').controller('preferencesSign',
    function($scope, $timeout, signService, configService, profileService, lodash) {
        var fc = profileService.focusedClient;
        var walletId = fc.credentials.walletId;
        var config = configService.getSync();
        var addresses = [];

        config.aliasFor = config.aliasFor || {};
        $scope.alias = config.aliasFor[walletId] || fc.credentials.walletName;

        $scope.sign = function(address) {
            var toSign = $scope.signForm.message.$modelValue;

            signService.deriveKeyAndSign(address, fc, toSign, function(signed) {
                $scope.signature = signed;
                $scope.$apply();
            })
        };

        $scope.init = function() {

            $scope.externalSource = null;
            fc = profileService.focusedClient;

            fc.getMainAddresses({
                doNotVerify: true
            }, function(err, x) {
                if (x.length > 0) {
                    lodash.each(x, function(a) {
                        addresses.push(a);
                    });
                } else {
                    console.log('* No addresses.');
                }

                $scope.addresses = addresses;
                $scope.$apply();
            });
        }});

