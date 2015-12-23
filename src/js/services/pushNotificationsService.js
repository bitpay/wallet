 'use strict';
 angular.module('copayApp.services')
   .factory('pushNotificationsService', function($http) {
     var root = {};

     //"APA91bHCysW7fzE_ks5HPOu2BGr0G7T-aD5SPfzaSGIKuhp82gFUcopVPPck8EfnxgHyK_3QJ9FdFS8H2mjAILDv3jdrH6slJzmCwoszya9XdJz4Uv-cxkLDYXb7z086TD3uPgSLnMUO"

     root.subscribe = function(opts) {
       return $http.post('http://192.168.1.120:8000/subscribe', opts);
     }

     return root;

   });
