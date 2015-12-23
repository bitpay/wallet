 'use strict';
 angular.module('copayApp.services')
   .factory('pushNotificationsService', function($http) {
     var root = {};

     root.subscribe = function(opts) {
       return $http.post('http://192.168.1.120:8000/subscribe', opts);
     }

     return root;

   });
