/**
 * Created by one on 14/07/16.
 */
'use strict';

angular.module('copayApp.controllers').controller('preferencesVerify',
    function($scope, verifyService) {

        $scope.verify = function() {
            var message = $scope.verifyForm.message.$modelValue;
            var signature = $scope.verifyForm.signature.$modelValue;
            var pubKey = $scope.verifyForm.pubKey.$modelValue;


            verifyService.getMessageVerification(message, signature, pubKey, function(result) {

                $scope.result = result;
               // $scope.$apply();
            })
        };

    });

