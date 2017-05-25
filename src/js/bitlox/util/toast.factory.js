(function(window, angular) {
    'use strict';

    angular.module('app.util')
        .config(ToastConfig)
        .factory('Toast', ToastFactory);


    function ToastConfig() {

    }


    function ToastFactory() {

        var Toast = function(){};

        var show = Toast.prototype.show = function(params) {
            console.log("BITLOX LOG")
            console.log(params);
        };

        Toast.prototype.clear = function(toast) {

        };

        Toast.prototype.info = function(message) {
            console.info("BITLOX info")
            console.info(message)
        };

        Toast.prototype.error = function(message) {
            console.error("BITLOX error")
            console.error(message)
        };

        Toast.prototype.errorHandler = function(err) {
            console.error("BITLOX errorHandler")
            console.error(err)
        };

        Toast.prototype.success = function(message) {
            console.info("BITLOX success")
            console.info(message)
        };

        Toast.prototype.warning = function(message) {
            console.warn("BITLOX warning")
            console.warn(message)
        };

        return new Toast();
    }

})(window, window.angular);
