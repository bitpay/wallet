'use strict';

//Setting up route
angular
  .module('copay')
  .config(function($routeProvider) {

    $routeProvider
      .when('/', {
        templateUrl: 'signin.html',
        validate: false
      })
      .when('/signin', {
        templateUrl: 'signin.html',
        validate: false
      })
      .when('/import', {
        templateUrl: 'import.html',
        validate: false
      })
      .when('/setup', {
        templateUrl: 'setup.html',
        validate: false
      })
      .when('/addresses', {
        templateUrl: 'addresses.html',
        validate: true
      })
      .when('/join/:id', {
        templateUrl: 'join.html',
        validate: true
      })
      .when('/transactions', {
        templateUrl: 'transactions.html',
        validate: true
      })
      .when('/send', {
        templateUrl: 'send.html',
        validate: true
      })
      .when('/backup', {
        templateUrl: 'backup.html',
        validate: true
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
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      if ((!$rootScope.wallet || !$rootScope.wallet.id) && next.validate) {
        $location.path('signin');
      }
    });
  });
