(function (window, angular) {
  'use strict'

  angular.module('app.util')
        .constant('CUSTOMNETWORKS',  {
  "deuscoin": {
    "network": "deuscoin",
    "name": "deuscoin",
    "alias": "Deuscoin",
    "code": "deus",
    "symbol": "DEUS",
    "derivationCoinPath": 146,
    "ratesUrl": "https://bws.deuscoin.org:8443/rates",
    "pubkeyhash": 0x1e,
    "privatekey": 0x80,
    "scripthash": 0x23,
    "xpubkey": 0x0488b21e,
    "xprivkey": 0x0488ade4,
    "bwsUrl": "https://bws.deuscoin.org/bws/api",
    "port": 19697,
    "networkMagic": 0x9ee8bc5a,
    "explorer": "https://explorer.deuscoin.org/"
  },
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
