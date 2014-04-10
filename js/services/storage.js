'use strict';

angular.module('copay.storage')
  .factory('Storage', function($rootScope) {


    var _key = function(walletId, key) {
      return walletId + '::' + key;
    };

    var _pushKey = function(walletId, key) {
       var keys = localStorage.getItem(walletId);
       localStorage.setItem(walletId, (keys?keys+',':'') +key);
    };

    return {        
      getGlobal: function( key) {
       return  JSON.parse(localStorage.getItem(key));
      },
      setGlobal: function( key, data) {
       localStorage.setItem(key, JSON.stringify(data));
      },
      get: function(walletId, key) {
        if (!walletId) return;
        return  JSON.parse(localStorage.getItem(_key(walletId,key)));
      },
      set: function(walletId, key, data) {
        if (!walletId) return;
        var k = _key(walletId,key);
        localStorage.setItem(k, JSON.stringify(data));
        _pushKey(walletId, k);
      },
      remove: function(walletId, key) {
        localStorage.removeItem(_key(walletId,key));
      },
      clearAll: function(walletId){
        var keys = localStorage.getItem(walletId);
        keys.split(',').forEach(function(k){
          localStorage.removeItem(key);
        });
      },
      addWalletId: function(walletId) {
        var ids = localStorage.getItem('walletIds');
        localStorage.setItem('walletIds', (ids?ids+',':'')  + walletId);
      },
      delWalletId: function(walletId) {
        var ids = localStorage.getItem('walletIds');
        if (ids) {
          var is = ids.split(','); 
          var newIds = [];
          is.forEach(function(i) {
            if (i != walletId) {
              newIds.push(i);
            }
          });
          localStorage.setItem('walletIds', newIds.join(',') );
        }
      },
      getWalletIds: function() {
        var ids = localStorage.getItem('walletIds');
        return ids ? ids.split(',') : [];
      },
    };
  });
