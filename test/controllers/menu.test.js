'use strict';
 
describe('menuController', function(){
    var scope, controller;
 
    beforeEach(angular.mock.module('copayApp.controllers'));
    beforeEach(angular.mock.inject(function($rootScope, $controller){
      scope = $rootScope.$new();
      controller = $controller('menuController', {$scope: scope});
    }));

    it('should have a menu variable', function(){
      expect(controller.menu).not.toBeUndefined();
    });
});
