'use strict';

angular.module('copayApp.services').service('nodeWebkitService', function() {

  this.readFromClipboard = function() {
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.get();
  };

  this.writeToClipboard = function(text) {
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.set(text);
  };

  this.openExternalLink = function(url) {
    var gui = require('nw.gui');
    return gui.Shell.openExternal(url);
  };

});
