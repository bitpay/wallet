'use strict';

//Setting up route
angular
  .module('cosign')
  .config(function($routeProvider) {

    $routeProvider
      .when('/', {
        templateUrl: 'home.html' 
      }).when('/transactions', {
        templateUrl: 'transactions.html' 
      }).when('/send', {
        templateUrl: 'send.html' 
      }).when('/backup', {
        templateUrl: 'backup.html' 
      }).when('/signin', {
        templateUrl: 'signin.html' 
      }).otherwise({
        templateUrl: '404.html'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('cosign')
  .config(function($locationProvider) {
    $locationProvider
      .html5Mode(false);
      //.hashPrefix('!');
  });
