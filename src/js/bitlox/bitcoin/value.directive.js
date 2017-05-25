(function(window, angular, BigNumber) {
    'use strict';

    angular.module('bitcoin')
        .directive('bcVal', bcVal);

    bcVal.$inject = ['$rootScope', '$filter'];

    function bcVal($rootScope, $filter) {
        return {
            restrict: 'A',
            scope: {
                bcVal: '=',
            },
            link: function(scope, elem) {
                var val = new BigNumber(parseInt(scope.bcVal, 10));

                scope.$watch('bcVal', function(v) {
                    if (v !== undefined) {
                        val = new BigNumber(parseInt(v, 10));
                        update();
                    }
                });

                $rootScope.$watch('denomination', function(d) {
                    if (d) {
                        update();
                    }
                });

                var filter = $filter('bcNumber');
                function update() {
                    var numStr = val.dividedBy($rootScope.denomination).toString();
                    numStr = filter(numStr);
                    elem.text(numStr + " " + $rootScope.currency);
                }
            }
        };
    }

})(window, window.angular, window.BigNumber);
