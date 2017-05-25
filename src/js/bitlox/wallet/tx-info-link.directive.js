(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('txInfoLink', txInfoLink);

    txInfoLink.$inject = [];

	var baseUrlroot = 'https://bitlox.io';
// 	var baseUrlroot = '';

    function txInfoLink() {
        return {
            restrict: 'E',
            template: '<a ng-href="'+ baseUrlroot +'/tx/{{txid}}" target="_blank">{{display}}</a>',
            link: function(scope, elem, attrs) {
                var txid = scope.txid = attrs.txid;
                scope.display = txid.slice(0, 8) + '...' + txid.slice(txid.length - 9, txid.length - 1);
            }
        };
    }

})(window, window.angular);
