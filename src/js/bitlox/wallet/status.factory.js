(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .factory('WalletStatus', WalletStatusFactory);

    WalletStatusFactory.$inject = ['$rootScope'];

    function WalletStatusFactory($rootScope) {

        var $scope = $rootScope.$new();

        $scope.STATUS_LOADING_UNSPENT = "loading unspent";
        $scope.STATUS_LOADING_TRANSACTIONS = "loading transactions";
        $scope.STATUS_LOADING = "loading";
        $scope.STATUS_SENDING = "sending";
        $scope.STATUS_SIGNING = "signing";

        return $scope;

    }

})(window, window.angular);
