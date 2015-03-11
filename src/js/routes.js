'use strict';

var unsupported;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  var isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
}


//Setting up route
angular
  .module('copayApp')
  .config(function(localStorageServiceProvider, bwcServiceProvider, $stateProvider, $urlRouterProvider) {

    localStorageServiceProvider
      .setPrefix('copayApp')
      .setStorageType('localStorage')
      .setNotify(true, true);

    bwcServiceProvider.setBaseUrl('http://localhost:3001/copay/api');

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('signin', {
        url: '/',
        templateUrl: 'views/signin.html',
        authenticate: false
      })
      .state('createProfile', {
        url: '/createProfile',
        templateUrl: 'views/createProfile.html',
        authenticate: false
      })
      .state('unsupported', {
        url: '/unsupported',
        templateUrl: 'views/unsupported.html',
        authenticate: false
      })
      .state('uri-payment', {
        url: '/uri-payment/:data',
        controller: 'paymentUriController',
        authenticate: false
      })
      .state('selectWalletForPayment', {
        url: '/selectWalletForPayment',
        controller: 'walletForPaymentController',
        authenticate: false
      })
      .state('join', {
        url: '/join',
        controller: 'joinController',
        templateUrl: 'views/join.html',
        authenticate: true
      })
      .state('import', {
        url: '/import',
        controller: 'importController',
        templateUrl: 'views/import.html',
        authenticate: true
      })
      .state('importProfile', {
        url: '/importProfile',
        templateUrl: 'views/importProfile.html',
        authenticate: false
      })
      .state('create', {
        url: '/create',
        controller: 'createController',
        templateUrl: 'views/create.html',
        authenticate: true
      })
      .state('copayers', {
        url: '/copayers',
        controller: 'copayersController',
        templateUrl: 'views/copayers.html',
        authenticate: true
      })
      .state('profile', {
        url: '/profile',
        controller: 'profileController',
        templateUrl: 'views/profile.html',
        authenticate: true
      })
      .state('home', {
        url: '/home',
        controller: 'homeController',
        templateUrl: 'views/home.html',
        walletShouldBeComplete: true,
        authenticate: true
      })
      .state('receive', {
        url: '/receive',
        controller: 'receiveController',
        templateUrl: 'views/receive.html',
        walletShouldBeComplete: true,
        authenticate: true
      })
      .state('history', {
        url: '/history',
        controller: 'historyController',
        templateUrl: 'views/history.html',
        walletShouldBeComplete: true,
        authenticate: true
      })
      .state('send', {
        url: '/send',
        controller: 'sendController',
        templateUrl: 'views/send.html',
        walletShouldBeComplete: true,
        authenticate: true
      })
      .state('preferences', {
        url: '/preferences',
        controller: 'preferencesController',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        authenticate: true
      })
      .state('settings', {
        url: '/settings',
        controller: 'settingsController',
        templateUrl: 'views/settings.html',
        authenticate: false
      })
      .state('warning', {
        url: '/warning',
        controller: 'warningController',
        templateUrl: 'views/warning.html',
        authenticate: false
      })
      .state('add', {
        url: '/add',
        controller: 'addController',
        templateUrl: 'views/add.html',
        authenticate: true
      })
      .state('signout', {
        url: '/signout',
        controller: 'signoutController',
        authenticate: true
      });
  })
  .run(function($rootScope, $state, gettextCatalog, uriHandler, isCordova) {

    var userLang, androidLang;

    if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
      userLang = androidLang[1];
    } else {
      // works for iOS and Android 4.x
      userLang = navigator.userLanguage || navigator.language;
    }

    userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
    gettextCatalog.setCurrentLanguage(userLang);

    // Register URI handler, not for mobileApp
    if (!isCordova) {
      uriHandler.register();
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      if (unsupported) {
        $state.transitionTo('unsupported');
        event.preventDefault(); 
      }

      if (!$rootScope.iden && toState.authenticate) {
        $state.transitionTo('signin');
        event.preventDefault(); 
      }
      if ($rootScope.wallet && !$rootScope.wallet.isComplete() && toState.walletShouldBeComplete) {
        $state.transitionTo('copayers');
        event.preventDefault(); 
      }
    });
  });
