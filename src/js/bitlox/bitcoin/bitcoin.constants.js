(function(window, angular) {
    'use strict';

    angular.module('bitcoin')
        .constant('COIN', 100000000)
        .constant('DEFAULT_FEE', 10000) // 0.0001 BTC
        .constant('MIN_OUTPUT', 5460)   // 0.0000546 BTC
        .constant('MAINNET_PUBLIC', 0x0488b21e)
        .constant('MAINNET_PRIVATE', 0x0488ade4)
        .constant('TESTNET_PUBLIC', 0x043587cf)
        .constant('TESTNET_PRIVATE', 0x04358394)

        .constant('RECEIVE_CHAIN', 0)
        .constant('CHANGE_CHAIN', 1)
    // how many extra addresses to generate
        .constant('GAP', 10);

})(window, window.angular);
