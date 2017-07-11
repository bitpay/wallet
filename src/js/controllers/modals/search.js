'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, $ionicScrollDelegate, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var wallet;
  var isCordova = platformInfo.isCordova;

  $scope.updateSearchInput = function(search) {
    if (isCordova)
      window.plugins.toast.hide();
    currentTxHistoryPage = 0;
    throttleSearch(search);
    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  }

  var throttleSearch = lodash.throttle(function(search) {

    function filter(search) {
      $scope.filteredTxHistory = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && $scope.addressbook && $scope.addressbook[tx.addressTo]) addrbook = $scope.addressbook[tx.addressTo].name || $scope.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';
        var txid = tx.txid ? tx.txid : '';
        return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment + txid).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var day = ('0' + date.getDate()).slice(-2).toString();
        var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        return [month, day, year].join('/');
      };

      if (lodash.isEmpty(search)) {
        $scope.txHistoryShowMore = false;
        return [];
      }

      $scope.filteredTxHistory = lodash.filter($scope.completeTxHistory, function(tx) {
        if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
        return lodash.includes(tx.searcheableString, search.toLowerCase());
      });

      if ($scope.filteredTxHistory.length > HISTORY_SHOW_LIMIT) $scope.txHistoryShowMore = true;
      else $scope.txHistoryShowMore = false;
      return $scope.filteredTxHistory;
    };

    $scope.txHistorySearchResults = filter(search).slice(0, HISTORY_SHOW_LIMIT);

    if (isCordova)
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + $scope.filteredTxHistory.length));

    $timeout(function() {
      $scope.$apply();
    });

  }, 1000);

  $scope.moreSearchResults = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.showHistory = function() {
    $scope.txHistorySearchResults = $scope.filteredTxHistory ? $scope.filteredTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT) : [];
    $scope.txHistoryShowMore = $scope.filteredTxHistory.length > $scope.txHistorySearchResults.length;
  };

});
