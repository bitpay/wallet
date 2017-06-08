'use strict';

angular.module('copayApp.services').factory('timeService', function() {
  var root = {};

  root.withinSameMonth = function(time1, time2) {
    if (!time1 || !time2) return false;
    var date1 = new Date(time1);
    var date2 = new Date(time2);
    return root.getMonthYear(date1) === root.getMonthYear(date2);
  }

  root.withinPastDay = function(time) {
    var now = new Date();
    var date = new Date(time);
    return (now.getTime() - date.getTime()) < (1000 * 60 * 60 * 24);
  };

  root.isDateInCurrentMonth = function(date) {
    var now = new Date();
    return root.getMonthYear(now) === root.getMonthYear(date);
  };

  root.getMonthYear = function(date) {
    return date.getMonth() + date.getFullYear();
  }

  return root;

});
