'use strict';

//Setting up route
angular
  .module('cosign')
  .config(function($stateProvider, $urlRouterProvider) {
    // For unmatched routes:
    $urlRouterProvider.otherwise('/');

    // States for cosign
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/home.html'
      })
      .state('signin', {
        url: '/signin',
        templateUrl: 'views/signin.html'
      })
      .state('404', {
        url: '/404',
        templateUrl: 'views404.hmtl'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('cosign')
  .config(function($locationProvider) {
    $locationProvider.hashPrefix('!');
  });
