(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletTransactions', walletTransactions);

    walletTransactions.$inject = [];

    function walletTransactions() {
        return {
            restrict: 'E',
            templateUrl: 'wallet/info/transactions.html',
            link: function(scope) {
                var pageSize = scope.pageSize = 10;

                scope.$watchCollection('wallet.transactions', function(txs) {
                    if (txs && Array.isArray(txs) && txs.length) {
                        var page = scope.page = 1;
                        scope.transactions = makeTxSlice(page, txs);
                    }
                });

                scope.pageChange = function() {
                    scope.transactions = makeTxSlice(scope.page, scope.wallet.transactions);
                };

                function makeTxSlice(page, txs) {
                    var startIndex = pageSize * (page - 1);
                    var endIndex = startIndex + pageSize;
                    return txs.slice(startIndex, endIndex);
                }

            }
        };
    }

})(window, window.angular);
