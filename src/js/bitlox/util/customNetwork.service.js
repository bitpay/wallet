
(function(angular) {
'use strict';
angular.module('app.util')
.service('customNetworks',
['$q', '$http', 'appConfigService', 'storageService', 'bitcore',

function Bitlox($q, $http, appConfigService, storageService, bitcore) {

this.customNetworks = {          
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
if((!ionic.Platform.isIOS() && appConfigService.packageName === 'bitlox') || appConfigService.packageName === 'deuscoin') {
  this.customNetworks.deuscoin = {
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
}
if((!ionic.Platform.isIOS() && appConfigService.appName === 'bitlox') || appConfigService.packageName === 'aureus') {
  this.customNetworks.aureus = {
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
this.getStatic = function() {
  return this.customNetworks;
}
this.getAll = function() {
  var resourcePromise = $q.defer();
  var self = this
  storageService.getCustomNetworks(function(err, networkListRaw) {
    if(networkListRaw) {
      var networkList = JSON.parse(networkListRaw)
      for (var n in networkList) {
         self.customNetworks[networkList[n].name] = networkList[n]
      }      
    }
    resourcePromise.resolve(self.customNetworks)
  })

  return resourcePromise.promise    
}
this.getCustomNetwork = function(customParam) {
      var def = $q.defer();
      var self = this
      if(customParam) {
        var networkName = customParam
        this.getAll().then(function(CUSTOMNETWORKS) {
          // check apple approved list on iOS, and the full list of whatever we can support for Android
          var customNet = CUSTOMNETWORKS[customParam]
          if(customNet) {
            def.resolve(customNet)
          } else {
            // check previously imported custom nets
            var customNetworks = storageService.getCustomNetworks(function(err, customNetworkListRaw) {
              var customNetworkList = {}
              if(customNetworkListRaw) {
                customNetworkList = JSON.parse(customNetworkListRaw)
              }
              if(customNetworkList[customParam]) {
                self.customNetworks[customParam] = customNetworkList[customParam]
                // console.log('got network from storageService', customNetworkList[customParam])
                def.resolve(customNetworkList[customParam])
              } else {
                // try getting it from bitlox website
                $http.get("https://btm.bitlox.com/coin/"+networkName+".php").then(function(response){
                  // console.log('got network from server', response)
                  if(!response) {
                    def.reject();
                  }
                  var res = response.data;
                  res.pubkeyhash = parseInt(res.pubkeyhash,16)
                  res.privatekey = parseInt(res.privatekey,16)
                  res.scripthash = parseInt(res.scripthash,16)
                  res.xpubkey = parseInt(res.xpubkey,16)
                  res.xprivkey = parseInt(res.xprivkey,16)
                  res.networkMagic = parseInt(res.networkMagic,16)
                  res.port = parseInt(res.port, 10)
                  // console.log('parsed network from server', res)
                  customNetworkList[customParam] = res;
                  self.customNetworks[customParam] = res;
                  storageService.setCustomNetworks(JSON.stringify(customNetworkList));
                  if(!bitcore.Networks.get(res.name)) { bitcore.Networks.add(res) }
                  def.resolve(res)
                }, function(err) {
                  console.warn(err)
                  def.reject();
                })              
              }
            })
          }
        })        
      } else {
        return $q.resolve();
      }
      return def.promise;

    }

}])})(window.angular);

