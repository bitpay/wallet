'use strict';

//Setting up route
angular
  .module('copay')
  .config(function($routeProvider) {

    $routeProvider
      .when('/', {
        templateUrl: 'signin.html'
      })
      .when('/signin', {
        templateUrl: 'signin.html' 
      })
      .when('/home', {
        templateUrl: 'home.html'
      })
      .when('/join/:id', {
        templateUrl: 'join.html'
      })
      .when('/transactions', {
        templateUrl: 'transactions.html' 
      })
      .when('/send', {
        templateUrl: 'send.html' 
      })
      .when('/backup', {
        templateUrl: 'backup.html' 
      })
      .otherwise({
        templateUrl: '404.html'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('copay')
  .config(function($locationProvider) {
    $locationProvider
      .html5Mode(false);
      //.hashPrefix('!');
  });
