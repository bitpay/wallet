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
      .when('/setup', {
        templateUrl: 'setup.html' 
      })
      .when('/home', {
        templateUrl: 'home.html'
      })
      .when('/join/:id', {
        templateUrl: 'join.html'
      })
      .when('/peer', {
        templateUrl: 'peer.html'
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
  })
  .run(function($rootScope, $location) {
    $rootScope.$on('$routeChangeStart', function() {
      if (!$rootScope.wallet || !$rootScope.wallet.id) {
        console.log('############ no wallet');
        $location.path('signin');
      }
    });
  });
