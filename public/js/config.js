'use strict';

//Setting up route
angular
  .module('cosign')
  .config(function($routeProvider) {
    $routeProvider.
      when('signin', {
        templateUrl: '/views/signin.html',
        title: 'Signin'
      })
      .otherwise({
        templateUrl: '/views/404.html',
        title: 'Error'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  });
