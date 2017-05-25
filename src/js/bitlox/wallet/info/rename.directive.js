(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletRename', walletRename);

    walletRename.$inject = ['Wallet', 'Toast'];

    function walletRename(Wallet, Toast) {
        return {
            templateUrl: 'wallet/info/rename.html',
            link: function(scope) {
                reset();

                scope.renameWallet = function() {
                    scope.renamingWallet = true;
                    scope.wallet.rename(scope.newName).then(function() {
                        reset();
                    }, Toast.errorHandler).finally(function() {
                        scope.renamingWallet = false;
                    });
                };

                function reset() {
                    scope.newName = "";
                }
            }
        };
    }

})(window, window.angular);
