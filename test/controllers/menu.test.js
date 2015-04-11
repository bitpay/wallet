'use strict';
 
describe('menuController', function(){
    var state, scope, controller;
 
    beforeEach(angular.mock.module('copayApp.controllers'));
    beforeEach(angular.mock.module('stateMock'));
    beforeEach(angular.mock.inject(function($rootScope, $controller, $state){
      state = $state;
      scope = $rootScope.$new();
      controller = $controller('menuController', {$scope: scope});
    }));

    it('should have a menu variable', function(){
      expect(controller.menu).not.toBeUndefined();
    });
});
