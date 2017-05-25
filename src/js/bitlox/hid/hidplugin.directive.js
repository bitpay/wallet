(function(window, angular) {
    'use strict';

    angular.module('hid')
        .directive('hidPlugin', plugin);

    plugin.$inject = ['$compile'];

    function plugin($compile) {
        return {
            restrict: 'E',
            link: function(scope, elm) {
                var plugintmpl = '<object height="1" id="hidapiPlugin" ' +
                    'type="application/x-hidapibrowserplugin" width="1">' +
                    '<param name="onload" value="pluginLoaded">' +
                    '</object>';
                var b = $compile(plugintmpl)(scope);
                elm.replaceWith(b);
            }
        };

    }

})(window, window.angular);
