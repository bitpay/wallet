'use strict';

angular.module('copay.storage')
  .factory('Storage', function($rootScope) {
    return {        
      get: function(key) {
       return  JSON.parse(localStorage.getItem(key));
      },

      set: function(key, data) {
       localStorage.setItem(key, JSON.stringify(data));
      },

      remove: function(key) {
        localStorage.removeItem(key);
      },
      
      clearAll: function() {
        localStorage.clear();
      }
    };
  });
