'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function($scope, historicLog, platformInfo) {

    var logLevels = historicLog.getLevels();
    var logFilterWeight = historicLog.getDefaultLevel().weight;

    // Log level slider setup.
    var logLevelSliderInitialValue = logFilterWeight;
    var logLevelSliderCeil = logFilterWeight;
    var logLevelSliderStepsArray = [];

    for (var i = 0; i < logLevels.length; i++) {
      logLevelSliderStepsArray.push({value: logLevels[i].weight, legend: logLevels[i].label});
    }

    $scope.logOptionsTitle = 'Filter log';
    $scope.logOptions = {
      logLevelSlider: {
        value: logLevelSliderInitialValue,
        opts: {
          floor: 0,
          ceil: logLevelSliderCeil,
          step: 1,
          hideLimitLabels: true,
          hidePointerLabels: true,
          showTicks: true,
          showTicksValues: false,
          showSelectionBar: true,
          stepsArray: logLevelSliderStepsArray,
          onEnd: function(sliderId, modelValue, highValue, pointerType) {
            $scope.filteredLogs = historicLog.get(modelValue);
          }
        }
      }
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.isCordova = platformInfo.isCordova;
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.allLogs = historicLog.get();
      $scope.filteredLogs = historicLog.get(logFilterWeight);

      $scope.prepare = function() {
        var log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
        log += '\n\n';
        log += $scope.allLogs.map(function(v) {
          return v.msg;
        }).join('\n');

        return log;
      };

      $scope.sendLogs = function() {
        var body = $scope.prepare();

        window.plugins.socialsharing.shareViaEmail(
          body,
          'Copay Logs',
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      };

      $scope.showOptionsMenu = function() {
        $scope.showOptions = true;
      };
    });
  });
