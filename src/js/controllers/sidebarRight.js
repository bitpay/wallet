'use strict';

angular.module('copayApp.controllers').controller('sidebarRightController', function($rootScope, $scope, $state, $log, $timeout, lodash, go, themeService, profileService, configService) {

  var self = this;
  var config = configService.getSync();
  var filterBarInstance;
  this.appletGalleryLayout = config.view.appletGalleryLayout;
  this.applets = themeService.getAppletSkins();

  var nextLayout = {};
  nextLayout['grid'] = 'list';
  nextLayout['list'] = 'list-detail';
  nextLayout['list-detail'] = 'grid';

  this.init = function() {
    $('.gridly').gridly();
  }

  this.init();
});
