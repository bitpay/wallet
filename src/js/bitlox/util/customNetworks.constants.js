(function (window, angular) {
  'use strict'

  angular.module('app.util')
        .constant('CUSTOMNETWORKS',  {
          
          livenet: {
            network: 'livenet',
            name: 'livenet',
            alias: 'Bitcoin',
            code: 'btc',
            symbol: 'BTC',
            "ratesUrl": "https://bitpay.com/api/rates",
            derivationCoinPath: '0',
            pubkeyhash: 0x00,
            privatekey: 0x80,
            scripthash: 0x05,
            xpubkey: 0x0488b21e,
            xprivkey: 0x0488ade4,
            networkMagic: 0xf9beb4d9,
            port: 8333,
            bwsUrl: 'https://bws.bitlox.com/bws/api/',
            explorer: 'https://bitlox.io/',
            dnsSeeds: [
              'seed.bitcoin.sipa.be',
              'dnsseed.bluematt.me',
              'dnsseed.bitcoin.dashjr.org',
              'seed.bitcoinstats.com',
              'seed.bitnodes.io',
              'bitseed.xf2.org'
            ]

          }
        }
)
})(window, window.angular);
