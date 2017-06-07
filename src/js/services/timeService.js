'use strict';

angular.module('copayApp.services').factory('timeService', function() {
  var root = {};

  root.withinSameMonth = function(time1, time2) {
    if (!time1 || !time2) return false;
    var date1 = new Date(time1 * 1000);
    var date2 = new Date(time2 * 1000);
    return getMonthYear(date1) === getMonthYear(date2);
  }

  root.withinPastDay = function(time) {
    var now = new Date();
    var date = new Date(time * 1000);
    return (now.getTime() - date.getTime()) < (1000 * 60 * 60 * 24);
  };

  root.isDateInCurrentMonth = function(date) {
    var now = new Date();
    return getMonthYear(now) === getMonthYear(date);
  };

  root.getMonthYear = function(date) {
    return date.getMonth() + date.getFullYear();
  }

  return root;

});
