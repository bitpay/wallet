(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletAddresses', walletAddresses);

    walletAddresses.$inject = ['Toast'];

    function walletAddresses(Toast) {
        return {
            templateUrl: 'wallet/info/addresses.html',
            link: function(scope) {
                // size of address QR codes
                scope.qrsize = 120;
                // will hold truthy values to show individual QR codes
                // for the addresses
                scope.showqr = {};

                scope.showQr = function(address, chainIndex, addrType) {
                    scope.showqr[address] = !scope.showqr[address];
                    if (addrType === 'receive') {
                        scope.wallet.showQr(chainIndex).catch(Toast.errorHandler);
                    }
                };
            }
        };
    }

})(window, window.angular);
