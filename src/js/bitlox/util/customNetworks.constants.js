(function (window, angular) {
  'use strict'

  angular.module('app.util').provider('CUSTOMNETWORKS', function CUSTOMNETWORKSProvider () {

    this.CUSTOMNETWORKS = {          
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
    if(!ionic.Platform.isIOS()) {
      this.CUSTOMNETWORKS.deuscoin = {
        "network": "deuscoin",
        "name": "deuscoin",
        "alias": "Deuscoin",
        "code": "deus",
        "symbol": "DEUS",
        "derivationCoinPath": 0,
        "ratesUrl": "https://bws.deuscoin.org:8443/rates",
        "pubkeyhash": 0x1e,
        "privatekey": 0x80,
        "scripthash": 0x23,
        "xpubkey": 0x0488b21e,
        "xprivkey": 0x0488ade4,
        "bwsUrl": "https://deus.dlc.net/bws/api",
        "port": 19697,
        "networkMagic": 0x9ee8bc5a,
        "explorer": "https://explorer.deuscoin.org/"
      }
      this.CUSTOMNETWORKS.aureus = {
        "network": "aureus",
        "name": "aureus",
        "alias": "Aureus",
        "code": "aurs",
        "symbol": "AURS",
        "derivationCoinPath": 0,
        "ratesUrl": "https://seed.aureus.cc/rates",
        "pubkeyhash": 0x17,
        "privatekey": 0x80,
        "scripthash": 0x1C,
        "xpubkey": 0x0488b21e,
        "xprivkey": 0x0488ade4,
        "bwsUrl": "https://aurs.dlc.net/bws/api",
        "port": "9697",
        "networkMagic": 0x6ee58c2a,
        "explorer": "https://explorer.aureus.cc/"        
      }
    }
    this.$get = [function isCUSTOMNETWORKSFactory () {
      return this.CUSTOMNETWORKS
    }]    
  })
})(window, window.angular);
