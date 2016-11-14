'use strict';

angular.module('copayApp.services').service('platformService', function() {

  this.electron = getElectron();

  function hasNode(){
    return typeof process !== "undefined" && typeof require !== "undefined";
  }

  function getElectron(){
    if(hasNode()){
      try {
        return require('electron');
      } catch (e) {
        return false;
      }
    }
  }
});
