(function(angular) {
'use strict';
angular.module('hid')
.service('bitlox',
['platformInfo',
'bitloxHidChrome',
'bitloxHidWeb',
'bitloxBleApi',
'bitloxWallet',
'bitloxTransaction',

function Bitlox(platformInfo,
bitloxHidChrome,
bitloxHidWeb,
bitloxBleApi,
bitloxWallet,
bitloxTransaction) {

this.api = bitloxHidWeb
if (platformInfo.isChromeApp) {
  this.api = bitloxHidChrome
}
else if(platformInfo.isMobile) {
  this.api = bitloxBleApi
}

this.wallet = bitloxWallet
this.transaction = bitloxTransaction

}])})(window.angular);
