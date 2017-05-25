(function(window, angular, BigNumber) {
    'use strict';

    angular.module('bitcoin')
        .directive('bcInput', bcInput);

    bcInput.$inject = ['$rootScope'];

    function bcInput($rootScope) {
        return {
            template: '<input class="form-control crypto-input" ' +
                'type="text" ng-model="displayVal">' +
                '<span class="input-group-addon crypto-input-label">{{symbol}}</span>',
            restrict: 'E',
            scope: {
                intVal: '=model',
            },
            link: function(scope) {
                $rootScope.$watch('currency', function() {
                    scope.symbol = $rootScope.currency;
                    updateDisplay();
                });

                scope.$watch('intVal', function(newVal) {
                    if (newVal === undefined ||
                        scope.displayVal === undefined ||
                        !scope.displayVal.length) {
                        return;
                    }
                    var val = parseInt(newVal, 10);
                    if (scope.displayVal.toString().match(/^0+\.0+$/)) {
                        return;
                    } else if (!newVal.toString().length) {
                        scope.displayVal = 0;
                    } else if (isNaN(val)) {
                        scope.displayVal = "-";
                    } else {
                        updateDisplay();
                    }
                });

                scope.$watch('displayVal', function(newVal) {
                    if (newVal === undefined) {
                        return;
                    }
                    var val = new BigNumber(parseFloat(newVal));
                    if (!newVal.toString().length) {
                        scope.intVal = 0;
                    } else if (newVal.toString().match(/^0+\.0+$/)) {
                        scope.intVal = 0;
                    } else if (isNaN(val)) {
                        scope.intVal = NaN;
                    } else {
                        scope.intVal = Math.floor(val.times($rootScope.denomination).toNumber());
                    }
                });

                function updateDisplay() {
                    var val = new BigNumber(parseInt(scope.intVal, 10));
                    var numStr = val.dividedBy($rootScope.denomination).toString();
                    scope.displayVal = numStr;
                }
            }
        };
    }

})(window, window.angular, window.BigNumber);
