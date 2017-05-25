(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletDelete', walletDelete);

    walletDelete.$inject = ['Wallet', 'Toast', 'hidapi'];

    function walletDelete(Wallet, Toast, hidapi) {
        return {
            scope: {
                wallet: '=',
                onDelete: '&',
            },
            templateUrl: 'wallet/info/delete.html',
            link: function(scope) {
                scope.deleteWallet = function() {
                    scope.deletingWallet = true;
                    scope.wallet.remove().then(function() {
                        scope.otpRequested = true;
                    }, Toast.errorHandler).finally(function() {
                        scope.deleteingWallet = false;
                    });
                };

                scope.formatDevice = function() {
                    scope.formatting = true;
                    hidapi.format().then(function() {
                        scope.otpRequested = true;
                    }, Toast.errorHandler).finally(function() {
                        scope.formatting = false;
                    });
                };

                scope.sendOtp = function() {
                    scope.sendingOtp = true;
                    scope.wallet.removeConfirm(scope.otp).then(function() {
                        scope.onDelete();
                    }, Toast.errorHandler).finally(function() {
                        scope.otpRequested = false;
                        scope.sendingOtp = false;
                    });
                };
            }
        };
    }

})(window, window.angular);
