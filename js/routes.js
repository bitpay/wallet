'use strict';

//Setting up route
angular
.module('copayApp')
.config(function($routeProvider) {

  $routeProvider
  .when('/', {
    templateUrl: 'views/home.html',
  })
  .when('/createProfile', {
    templateUrl: 'views/createProfile.html',
  })
  .when('/unsupported', {
    templateUrl: 'views/unsupported.html'
  })
  .when('/uri-payment/:data', {
    templateUrl: 'views/uri-payment.html'
  })
  .when('/join', {
    templateUrl: 'views/join.html',
    logged: true
  })
  .when('/import', {
    templateUrl: 'views/import.html',
    logged: true
  })
  .when('/create', {
    templateUrl: 'views/create.html',
    logged: true 
  })
  .when('/copayers', {
    templateUrl: 'views/copayers.html',
    logged: true
  })
  .when('/receive', {
    templateUrl: 'views/addresses.html',
    logged: true
  })
  .when('/history', {
    templateUrl: 'views/transactions.html',
    logged: true
  })
  .when('/send', {
    templateUrl: 'views/send.html',
    logged: true
  })
  .when('/more', {
    templateUrl: 'views/more.html',
    logged: true
  })
  .when('/settings', {
    templateUrl: 'views/settings.html',
    logged: true
  })
  .when('/warning', {
    templateUrl: 'views/warning.html',
    logged: true
  })
  .when('/manage', {
    templateUrl: 'views/manage.html',
    logged: true
  })
  .otherwise({
    templateUrl: 'views/errors/404.html',
    title: 'Error'
  });
});

//Setting HTML5 Location Mode
angular
.module('copayApp')
.config(function($locationProvider, $idleProvider, $keepaliveProvider) {
  $locationProvider
  .html5Mode(false)
  .hashPrefix('!');
  // IDLE timeout
  var timeout = config.wallet.idleDurationMin * 60 || 300;
  $idleProvider.idleDuration(timeout); // in seconds
  $idleProvider.warningDuration(40); // in seconds
  $keepaliveProvider.interval(30); // in seconds
})
.run(function($rootScope, $location, $idle, gettextCatalog) {
  gettextCatalog.currentLanguage = config.defaultLanguage;
  $idle.watch();
  $rootScope.$on('$routeChangeStart', function(event, next, current) {
    if (!localStorage || localStorage.length < 1) {
      $location.path('unsupported');
    } else {
      if (!$rootScope.iden && next.logged) {
        console.log('not logged... redirecting')
        $idle.unwatch();
        $location.path('/');
      }
    }
  });
})
.config(function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension|resource):/);
});
