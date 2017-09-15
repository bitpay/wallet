
(function(angular) {
'use strict';
angular.module('app.util')
.service('customNetworkService',
['$q', '$http', 'storageService', 'bitcore', 'CUSTOMNETWORKS',

function Bitlox($q, $http, storageService, bitcore, CUSTOMNETWORKS) {


this.getCustomNetwork = function(customParam) {
      var def = $q.defer();
      if(customParam) {
        var networkName = customParam
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
            // try getting it from bitlox website
            $http.get("https://btm.bitlox.com/coin/"+networkName+".php").then(function(response){
              console.log('got network from server', res)
              if(!response) {
                def.reject();
              }
              var res = response.data;
              res.pubkeyhash = parseInt(res.pubkeyhash,16)
              res.privatekey = parseInt(res.privatekey,16)
              res.scripthash = parseInt(res.scripthash,16)
              res.xpubkey = parseInt(res.xpubkey,16)
              res.xprivkey = parseInt(res.xprivkey,16)
              res.networkMagic = parseInt(res.magic,16)
              res.port = parseInt(res.port, 10)
              console.log('parsed network', res)
              customNetworkList[customParam] = res;
              CUSTOMNETWORKS[customParam] = res;
              storageService.setCustomNetworks(JSON.stringify(customNetworkList));
              bitcore.Networks.add(res)
              def.resolve(res)
            }, function(err) {
              console.warn(err)
              def.reject();
            })

          })
 
        }
      } else {
        return $q.resolve();
      }
      return def.promise;

    }

}])})(window.angular);

