'use strict';

angular.module('copayApp.controllers').controller('backupWordsController',
  function($rootScope, $scope, $timeout, $log, $compile, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var self = this;
    var fc = profileService.focusedClient;
    var customSortWords = [];
    self.sorted = false;

    setWords(fc.getMnemonic());

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.enableButton = function(word) {
      document.getElementById(word).disabled = false;
      lodash.remove(customSortWords, function(v) {
        return v == word;
      });
    }

    self.disableButton = function(word) {
      document.getElementById(word).disabled = true;
      customSortWords.push(word);
      self.addButton(word);
    }

    self.addButton = function(word) {
      var btnhtml = '<button class="button radius tiny"' +
        'ng-style="{\'background-color\':index.backgroundColor}"' +
        'data-ng-click="backupWordsC.removeButton($event)" id="_' + word + '" > ' + word + ' </button>';
      var temp = $compile(btnhtml)($scope);
      angular.element(document.getElementById('addWord')).append(temp);
      self.shouldContinue(customSortWords);
    }

    self.removeButton = function(event) {
      var id = (event.target.id);
      var element = document.getElementById(id);
      element.remove();
      self.enableButton(id.substring(1));
      self.shouldContinue(customSortWords);
    }

    self.shouldContinue = function(customSortWords) {
      if (lodash.isEqual(self.mnemonicWords, customSortWords))
        self.sorted = true;
      else
        self.sorted = false;
    }
  });
