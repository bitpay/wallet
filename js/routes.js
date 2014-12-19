'use strict';

var LS = require('../js/plugins/LocalStorage');
var ls = new LS();

var unsupported = false;

if (!ls || ls.length < 1)
  unsupported = true;


if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  var isaosp = (rxaosp && rxaosp[1] < 537);
  if (isaosp)
    unsupported = true;
}


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
      .when('/confirmed', {
        template: " ", // just fire controller
        controller: 'EmailConfirmationController',
      })
    // Payment intents come here.
    .when('/uri-payment/:data', {
      template: " ", // just fire controller
      controller: 'paymentUriController',
    })
      .when('/selectWalletForPayment', {
        template: " ", // just fire controller
        controller: 'walletForPaymentController',
        logged: true
      })
      .when('/join', {
        templateUrl: 'views/join.html',
        logged: true
      })
      .when('/import', {
        templateUrl: 'views/import.html',
        logged: true
      })
      .when('/importProfile', {
        templateUrl: 'views/importProfile.html',
      })
      .when('/create', {
        templateUrl: 'views/create.html',
        logged: true
      })
      .when('/copayers', {
        templateUrl: 'views/copayers.html',
        logged: true
      })
      .when('/homeWallet', {
        templateUrl: 'views/homeWallet.html',
        walletShouldBeComplete: true,
        logged: true
      })
      .when('/receive', {
        templateUrl: 'views/receive.html',
        walletShouldBeComplete: true,
        logged: true
      })
      .when('/history', {
        templateUrl: 'views/history.html',
        walletShouldBeComplete: true,
        logged: true
      })
      .when('/send', {
        templateUrl: 'views/send.html',
        walletShouldBeComplete: true,
        logged: true
      })
      .when('/more', {
        templateUrl: 'views/more.html',
        walletShouldBeComplete: true,
        logged: true
      })
      .when('/settings', {
        templateUrl: 'views/settings.html',
        walletShouldBeComplete: true,
        logged: false
      })
      .when('/warning', {
        templateUrl: 'views/warning.html',
        logged: true
      })
      .when('/profile', {
        templateUrl: 'views/profile.html',
        logged: true
      })
      .when('/add', {
        templateUrl: 'views/add.html',
        logged: true
      });

    if (config.developmentFeatures) {
      $routeProvider.when('/devLogin/:mail/:password', {
        templateUrl: 'views/devLogin.html',
        logged: false
      });
    }

    $routeProvider.otherwise({
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
  .run(function($rootScope, $location, $idle, gettextCatalog, uriHandler, isCordova) {

    gettextCatalog.currentLanguage = config.defaultLanguage;

    // Register URI handler, not for mobileApp
    if (!isCordova) {
      $idle.watch();
      uriHandler.register();
    }

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      if (unsupported) {
        $location.path('unsupported');
        return;
      }

      if (!$rootScope.iden && next.logged) {
        $idle.unwatch();
        $location.path('/');
      }
      if ($rootScope.wallet && !$rootScope.wallet.isComplete() && next.walletShouldBeComplete) {
        $location.path('/copayers');
      }
    });
  })
  .config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension|resource):/);
  });
