'use strict';

//Setting up route
angular
  .module('copayApp')
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
      .when('/settings', {
        templateUrl: 'settings.html',
        validate: false
      })
      .when('/unsupported', {
        templateUrl: 'unsupported.html'
      })
      .otherwise({
        templateUrl: '404.html'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('copayApp')
  .config(function($locationProvider) {
    $locationProvider
      .html5Mode(false);
      //.hashPrefix('!');
  })
  .run(function($rootScope, $location) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {

      if (!util.supports.data) {
        $location.path('unsupported');
      }  
      else {
        if ((!$rootScope.wallet || !$rootScope.wallet.id) && next.validate) {
          $location.path('signin');
        }
      }
    });
  })
  .config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension|resource):/);
  });
