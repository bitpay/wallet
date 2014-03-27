'use strict';

//Setting up route
angular
  .module('cosign')
  .config(function($routeProvider) {

    $routeProvider
      .when('/', {
        templateUrl: 'signin.html'
      })
      .when('/signin', {
        templateUrl: 'signin.html' 
      })
      .when('/home', {
        templateUrl: 'home.html'
      })
      .when('/join/:id', {
        templateUrl: 'join.html'
      })
      .otherwise({
        templateUrl: '404.html'
      });
  });

//Setting HTML5 Location Mode
angular
  .module('cosign')
  .config(function($locationProvider) {
    $locationProvider
      .html5Mode(false);
      //.hashPrefix('!');
  });
