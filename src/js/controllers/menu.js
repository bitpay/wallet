'use strict';

angular.module('copayApp.controllers').controller('menuController', function($state) {

  this.menu = [{
    'title': 'Home',
    'icon': 'icon-home',
    'link': 'walletHome'
  }, {
    'title': 'Receive',
    'icon': 'icon-receive',
    'link': 'receive'
  }, {
    'title': 'Send',
    'icon': 'icon-paperplane',
    'link': 'send'
  }, {
    'title': 'History',
    'icon': 'icon-history',
    'link': 'history'
  }];

  this.go = function(state) {
    $state.go(state);
  };

});
