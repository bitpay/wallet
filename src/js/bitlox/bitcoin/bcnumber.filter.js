(function(window, angular) {
    'use strict';

    angular.module('bitcoin')
        .filter('bcNumber', bcNumberFactory);

    bcNumberFactory.$inject = ['$filter'];

    function bcNumberFactory($filter) {
        var filter = $filter('number');
        var replace = /\.?0+$/;
        return function bcNumber(input) {
            var output = filter(input, 8);
            return output.replace(replace, '');
        };
    }

})(window, window.angular);
