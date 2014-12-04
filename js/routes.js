'use strict';

var LS = require('../js/plugins/LocalStorage');
var ls = new LS();

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
      .when('/uri-payment/:data', {
        templateUrl: 'views/uri-payment.html'
      })
      .when('/paymentIntent', {
        templateUrl: 'views/paymentIntent.html',
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
  .run(function($rootScope, $location, $idle, gettextCatalog, uriHandler) {
    gettextCatalog.currentLanguage = config.defaultLanguage;
    // not for mobileApp
    if (!window.cordova) {
      $idle.watch();
      uriHandler.register();
    }
    $rootScope.$on('$routeChangeStart', function(event, next, current) {


      if (!ls || ls.length < 1) {
        $location.path('unsupported');
      } else {
        if (!$rootScope.iden && next.logged) {
          $idle.unwatch();
          $location.path('/');
        }
        if ($rootScope.wallet && !$rootScope.wallet.isComplete() && next.walletShouldBeComplete) {
          $location.path('/copayers');
        }
      }
    });
  })
  .config(function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|chrome-extension|resource):/);
  });
