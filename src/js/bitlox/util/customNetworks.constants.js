(function(window, angular) {
    'use strict';

    angular.module('app.util')
        .constant('CUSTOMNETWORKS', {
        livenet: {
          network: 'livenet',
          name: 'livenet',
          alias: 'Bitcoin',
          code: 'btc',
          symbol: 'BTC',
          derivationCoinPath: "0",
          pubkeyhash: 0x00,
          privatekey: 0x80,
          scripthash: 0x05,
          xpubkey: 0x0488b21e,
          xprivkey: 0x0488ade4,
          networkMagic: 0xf9beb4d9,
          port: 8333,
          bwsUrl: 'https://bws.bitlox.com/bws/api/',
          explorer: 'https://bitlox.io/'
          
        },
        testnet: {
          network: 'bitcoin-testnet',
          name: 'testnet',
          alias: 'Testnet',
          code: 'tbtc',
          symbol: 'TBTC', 
          derivationCoinPath: "1",
          pubkeyhash: 0x6f,
          privatekey: 0xef,
          scripthash: 0xc4,
          xpubkey: 0x043587cf,
          xprivkey: 0x04358394,
          bwsUrl: 'https://bws.bitlox.com/bws/api/',
          explorer: 'https://tbtc.blockr.io/'
        },
      dogecoin: {
        network: 'dogecoin',
        name: 'dogecoin',
        alias: 'Dogecoin',
        code: 'xdg',
        symbol: 'XDG',
          derivationCoinPath: "3",
        pubkeyhash: 0x1e,
        privatekey: 0x9e,
        scripthash: 0x05,
        xpubkey: 0x0488c42e,
        xprivkey: 0x0488e1f4,
        bwsUrl: 'https://bws.bitlox.com/bws/api/',
        port: 22556,
        networkMagic: 0xc0c0c0c0,
        explorer: 'https://dogechain.info/'
      },
      litecoin: {
        network: 'litecoin',
        name: 'litecoin',
        alias: 'Litecoin',
        code: 'ltc',
        symbol: 'LTC',
          derivationCoinPath: "2",
        pubkeyhash: 0x30,
        privatekey: 0xb0,
        scripthash: 0x05,
        xpubkey:  0x0488c42e,
        xprivkey: 0x0488e1f4,
        bwsUrl: 'https://bws.bitlox.com/bws/api/',
        port: 9333,
        networkMagic: 0xfbc0b6db,
        explorer: 'https://insight.litecore.io/'
      }}
)

})(window, window.angular);
