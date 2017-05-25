(function(window, angular, BigNumber) {
    'use strict';

    angular.module('bitcoin')
        .factory('bcMath', bcMathFactory);

    bcMathFactory.$inject = ['COIN'];

    function bcMathFactory(COIN) {

        var bcMath = {
            satoshiToBTC: satoshiToBTC,
            toBTC: satoshiToBTC,
            btcToSatoshi: btcToSatoshi,
            toSatoshi: btcToSatoshi
        };

        var bitcoin = new BigNumber(COIN);

        return bcMath;

        function satoshiToBTC(satoshi) {
            return new BigNumber(satoshi).dividedBy(bitcoin).toNumber();
        }

        function btcToSatoshi(btc) {
            return new BigNumber(btc).times(bitcoin).toNumber();
        }
    }

})(window, window.angular, window.BigNumber);
