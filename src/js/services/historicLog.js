'use strict';
var logs = [];
angular.module('copayApp.services')
  .factory('historicLog', function historicLog(lodash) {
    var root = {};

    var levels = [
      { level: 'info',  weight: 0, label: 'Info'},
      { level: 'warn',  weight: 1, label: 'Warning'},
      { level: 'error', weight: 2, label: 'Error'},
      { level: 'debug', weight: 3, label: 'Debug', default: true}
    ];

    // Create an array of level weights for performant filtering.
    var weight = {};
    for (var i = 0; i < levels.length; i++) {
      weight[levels[i].level] = levels[i].weight;
    }

    root.getLevels = function() {
      return levels;
    };

    root.getDefaultLevel = function() {
      return lodash.find(levels, function(l) {
        return l.default;
      });
    };

    root.add = function(level, msg) {
      logs.push({
        level: level,
        msg: msg,
      });
    };

    root.get = function(filterWeight) {
      var filteredLogs = logs;
      if (filterWeight != undefined) {
        filteredLogs = lodash.filter(logs, function(l) {
          return weight[l.level] <= filterWeight;
        });
      }
      return filteredLogs;
    };

    return root;
  });
