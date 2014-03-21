'use strict';

//Setting up route
angular
  .module('cosign')
  .config(function($routeProvider) {

    $routeProvider
      .when('/signin', {
        templateUrl: 'signin.html' 
      })
      .when('/home', {
        templateUrl: 'home.html'
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
