import { Component } from '@angular/core';

@Component({
  selector: 'incoming-data-menu',
  template: `
  <action-sheet
    action-sheet-show="showMenu">

    <div ng-if="type === 'url'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Website</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__icon">
            <img ng-hide="https" src="img/icon-lock-x.svg" style="height: 22px;">
            <img ng-show="https" src="img/icon-lock-green.svg" style="height: 22px;">
          </div>
          <div class="incoming-data-menu__url__text">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" ng-click="goToUrl(data)">
        <img src="img/icon-link-external.svg">
        <div class="incoming-data-menu__item__text">Open website</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" ng-click="hide()">
        Cancel
      </a>
    </div>

    <div ng-if="type === 'bitcoinAddress'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Bitcoin Address</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__icon">
            <img src="img/icon-bitcoin-small.svg">
          </div>
          <div class="incoming-data-menu__url__text">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" ng-click="addToAddressBook(data)">
        <img src="img/icon-contacts.svg">
        <div class="incoming-data-menu__item__text">Add as a contact</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__item item item-icon-right" ng-click="sendPaymentToAddress(data)">
        <img src="img/icon-send-alt.svg">
        <div class="incoming-data-menu__item__text">Send payment to this address</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__item item item-icon-right" copy-to-clipboard="data">
        <img src="img/icon-paperclip.svg">
        <div class="incoming-data-menu__item__text">Copy to clipboard</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" ng-click="hide()">
        Cancel
      </a>
    </div>

    <div ng-if="type === 'text'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Text</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__text" style="border: 0;">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" copy-to-clipboard="data">
        <img src="img/icon-paperclip.svg">
        <div class="incoming-data-menu__item__text">Copy to clipboard</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" ng-click="hide()">
        Cancel
      </a>
    </div>

  </action-sheet>
  `
})
export class IncomingDataMenuComponent {
  // $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
  //   $timeout(function() {
  //     scope.data = data.data;
  //     scope.type = data.type;
  //     scope.showMenu = true;
  //     scope.https = false;
  //
  //     if(scope.type === 'url') {
  //       if(scope.data.indexOf('https://') === 0) {
  //         scope.https = true;
  //       }
  //     }
  //   });
  // });
  showMenu: boolean = false;
  externalLinkService: any = {
    show: () => {}
  };

  hide() {
    this.showMenu = false;
    //$rootScope.$broadcast('incomingDataMenu.menuHidden');
  }
  goToUrl(url: string) {
    this.externalLinkService.open(url);
  }
  sendPaymentToAddress(bitcoinAddress: string) {
    this.showMenu = false;
    // $state.go('tabs.send').then(function() {
    //   $timeout(function() {
    //     $state.transitionTo('tabs.send.amount', {toAddress: bitcoinAddress});
    //   }, 50);
    // });
  }
  addToAddressBook(bitcoinAddress) {
    this.showMenu = false;
    // $timeout(function() {
    //   $state.go('tabs.send').then(function() {
    //     $timeout(function() {
    //       $state.transitionTo('tabs.send.addressbook', {addressbookEntry: bitcoinAddress});
    //     });
    //   });
    // }, 100);
  };
}
