'use strict';

angular.module('copayApp.controllers').controller('menuController', function() {

  this.init = function() {
    this.menu = [{
      'title': 'Home',
      'icon': 'icon-home',
      'link': 'homeWallet'
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
  };

});
