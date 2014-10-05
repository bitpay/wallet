'use strict';

//Setting up route
angular
.module('copayApp')
.config(function($routeProvider) {

  $routeProvider
  .when('/', {
    templateUrl: 'views/home.html',
    validate: false
  })
  .when('/createProfile', {
    templateUrl: 'views/createProfile.html',
    validate: false
  })
  .when('/open', {
    templateUrl: 'views/open.html',
    validate: false
  })
  .when('/join', {
    templateUrl: 'views/join.html',
    validate: true
  })
  .when('/import', {
    templateUrl: 'views/import.html',
    validate: false
  })
  .when('/create', {
    templateUrl: 'views/create.html',
    validate: true 
  })
  .when('/copayers', {
    templateUrl: 'views/copayers.html',
    validate: true
  })
  .when('/receive', {
    templateUrl: 'views/addresses.html',
    validate: true
  })
  .when('/history', {
    templateUrl: 'views/transactions.html',
    validate: true
  })
  .when('/send', {
    templateUrl: 'views/send.html',
    validate: true
  })
  .when('/more', {
    templateUrl: 'views/more.html',
    validate: true
  })
  .when('/settings', {
    templateUrl: 'views/settings.html',
    validate: false
  })
  .when('/unsupported', {
    templateUrl: 'views/unsupported.html'
  })
  .when('/uri-payment/:data', {
    templateUrl: 'views/uri-payment.html'
  })
  .when('/warning', {
    templateUrl: 'views/warning.html',
    validate: true
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
      if ((!$rootScope.wallet || !$rootScope.wallet.id) && next.validate) {
        $idle.unwatch();
        $location.path('/');
      }

      // In creation?
      if ($rootScope.wallet && !$rootScope.wallet.isReady()) {
        $location.path('/copayers');
      }
    }
  });
})
.config(function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension|resource):/);
});
