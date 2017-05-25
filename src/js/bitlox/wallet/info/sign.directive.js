(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletSign', walletSign);

    walletSign.$inject = ['Toast'];

    function walletSign(Toast) {
        return {
            templateUrl: 'wallet/info/sign.html',
            link: function(scope) {

                scope.message = "";
                scope.address = null;
                scope.signed = null;

                scope.sign = function() {
                    scope.signed = null;
                    scope.signing = true;
                    scope.wallet.signMessage(scope.address.pub,
                                             scope.address.chain,
                                             scope.address.chainIndex,
                                             scope.message)
                        .then(function(signed) {
                            scope.signed = signed;
                        }, Toast.errorHandler)
                        .finally(function() {
                            scope.signing = false;
                        });
                };

                scope.$watchCollection('wallet', function(wallet) {
                    if (!wallet) {
                        return;
                    }
                    var addressList = [];
                    var addresses = wallet.addresses.receive;
                    Object.keys(addresses).forEach(function(address) {
                        address = addresses[address];
                        // make a new object, because the BIP32
                        // object causes errors.. something
                        // something circular object
                        addressList.push({
                            chain: address.chain,
                            chainIndex: address.chainIndex,
                            pub: address.pub
                        });
                    });
                    scope.addresses = addressList;
                    if (!scope.address) {
                        scope.address = addressList[0];
                    }
                });


            }
        };
    }

})(window, window.angular);
