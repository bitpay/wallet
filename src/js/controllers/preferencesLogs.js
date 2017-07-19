'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function($scope, historicLog, lodash, configService, gettextCatalog) {

    var config = configService.getSync();
    var logLevels = historicLog.getLevels();
    var selectedLevel;

    $scope.logOptions = lodash.indexBy(logLevels, 'level');

    var filterLogs = function(weight) {
      $scope.filteredLogs = historicLog.get(weight);
    };

    $scope.setOptionSelected = function(level) {
      var weight = $scope.logOptions[level].weight;
      $scope.fillClass = 'fill-bar-' + level;
      filterLogs(weight);
      lodash.each($scope.logOptions, function(opt) {
        opt.selected = opt.weight <= weight ? true : false;
        opt.head = opt.weight == weight;
      });

      // Save the setting.
      var opts = {
        log: {
          filter: level
        }
      };
      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });
    };

    $scope.prepareLogs = function() {
      var log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
      log += '\n\n';
      log += historicLog.get().map(function(v) {
        return '[' + v.timestamp + '][' + v.level + ']' + v.msg;
      }).join('\n');

      return log;
    };

    $scope.sendLogs = function() {
      var body = $scope.prepareLogs();

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

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      selectedLevel = lodash.has(config, 'log.filter') ? historicLog.getLevel(config.log.filter) : historicLog.getDefaultLevel();
      $scope.setOptionSelected(selectedLevel.level);
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      filterLogs(selectedLevel.weight);
    });
  });
