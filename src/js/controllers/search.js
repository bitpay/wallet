

  //
  // self.startSearch = function() {
  //   self.isSearching = true;
  //   self.txHistorySearchResults = [];
  //   self.result = [];
  //   self.historyShowMore = false;
  //   self.nextTxHistory = self.historyShowMoreLimit;
  // }
  //
  // self.cancelSearch = function() {
  //   self.isSearching = false;
  //   self.result = [];
  //   self.setCompactTxHistory();
  // }
  //
  // self.updateSearchInput = function(search) {
  //   self.search = search;
  //   if (isCordova)
  //     window.plugins.toast.hide();
  //   self.throttleSearch();
  //   $ionicScrollDelegate.resize();
  // }
  //
  // self.throttleSearch = lodash.throttle(function() {
  //
  //   function filter(search) {
  //     self.result = [];
  //
  //     function computeSearchableString(tx) {
  //       var addrbook = '';
  //       if (tx.addressTo && self.addressbook && self.addressbook[tx.addressTo]) addrbook = self.addressbook[tx.addressTo] || '';
  //       var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
  //       var message = tx.message ? tx.message : '';
  //       var comment = tx.note ? tx.note.body : '';
  //       var addressTo = tx.addressTo ? tx.addressTo : '';
  //       return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment).toString()).toLowerCase();
  //     }
  //
  //     function computeSearchableDate(date) {
  //       var day = ('0' + date.getDate()).slice(-2).toString();
  //       var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
  //       var year = date.getFullYear();
  //       return [month, day, year].join('/');
  //     };
  //
  //     if (lodash.isEmpty(search)) {
  //       self.historyShowMore = false;
  //       return [];
  //     }
  //     self.result = lodash.filter(self.completeHistory, function(tx) {
  //       if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
  //       return lodash.includes(tx.searcheableString, search.toLowerCase());
  //     });
  //
  //     if (self.result.length > self.historyShowLimit) self.historyShowMore = true;
  //     else self.historyShowMore = false;
  //
  //     return self.result;
  //   };
  //
  //   self.txHistorySearchResults = filter(self.search).slice(0, self.historyShowLimit);
  //   if (isCordova)
  //     window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + self.result.length));
  //
  //   $timeout(function() {
  //     $rootScope.$apply();
  //   });
  //
  // }, 1000);
  //
