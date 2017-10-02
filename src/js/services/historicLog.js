'use strict';
var logs = [];
angular.module('copayApp.services')
  .factory('historicLog', function historicLog(lodash) {
    var root = {};

    var levels = [
      { level: 'error', weight: 0, label: 'Error'},
      { level: 'warn',  weight: 1, label: 'Warning'},
      { level: 'info',  weight: 2, label: 'Info', default: true},
      { level: 'debug', weight: 3, label: 'Debug'}
    ];

    // Create an array of level weights for performant filtering.
    var weight = {};
    for (var i = 0; i < levels.length; i++) {
      weight[levels[i].level] = levels[i].weight;
    }

    root.getLevels = function() {
      return levels;
    };

    root.getLevel = function(level) {
      return lodash.find(levels, function(l) {
        return l.level == level;
      });
    };

    root.getDefaultLevel = function() {
      return lodash.find(levels, function(l) {
        return l.default;
      });
    };

    root.add = function(level, msg) {
      msg = msg.replace('/xpriv.*/', 'xpriv[Hidden]');
      logs.push({
        timestamp: new Date().toISOString(),
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
