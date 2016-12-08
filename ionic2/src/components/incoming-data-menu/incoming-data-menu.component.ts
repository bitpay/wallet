import { Component, NgZone, ViewChild } from '@angular/core';
import { IncomingDataService } from '../../services/incoming-data.service';
import { ActionSheetComponent } from './../action-sheet/action-sheet.component';

@Component({
  selector: 'incoming-data-menu',
  template: `
  <action-sheet
    [shown]="shown" (onHide)="hide()">

    <div *ngIf="type === 'url'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Website</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__icon">
            <img *ngIf="!https" src="assets/img/icon-lock-x.svg" style="height: 22px;">
            <img *ngIf="https" src="assets/img/icon-lock-green.svg" style="height: 22px;">
          </div>
          <div class="incoming-data-menu__url__text">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" (click)="goToUrl(data)">
        <img src="assets/img/icon-link-external.svg">
        <div class="incoming-data-menu__item__text">Open website</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" (click)="hide()">
        Cancel
      </a>
    </div>

    <div *ngIf="type === 'bitcoinAddress'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Bitcoin Address</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__icon">
            <img src="assets/img/icon-bitcoin-small.svg">
          </div>
          <div class="incoming-data-menu__url__text">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" (click)="addToAddressBook(data)">
        <img src="assets/img/icon-contacts.svg">
        <div class="incoming-data-menu__item__text">Add as a contact</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__item item item-icon-right" (click)="sendPaymentToAddress(data)">
        <img src="assets/img/icon-send-alt.svg">
        <div class="incoming-data-menu__item__text">Send payment to this address</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__item item item-icon-right" copy-to-clipboard="data">
        <img src="assets/img/icon-paperclip.svg">
        <div class="incoming-data-menu__item__text">Copy to clipboard</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" (click)="hide()">
        Cancel
      </a>
    </div>

    <div *ngIf="type === 'text'">
      <div class="incoming-data-menu__item head">
        <div class="incoming-data-menu__header">Text</div>
        <div class="incoming-data-menu__url">
          <div class="incoming-data-menu__url__text" style="border: 0; padding-left: 1.5rem;">
            {{data}}
          </div>
        </div>
      </div>
      <a class="incoming-data-menu__item item item-icon-right" copy-to-clipboard="data">
        <img src="assets/img/icon-paperclip.svg">
        <div class="incoming-data-menu__item__text">Copy to clipboard</div>
        <i class="icon bp-arrow-right"></i>
      </a>
      <a class="incoming-data-menu__cancel item" (click)="hide()">
        Cancel
      </a>
    </div>

  </action-sheet>
  `,
})
export class IncomingDataMenuComponent {

  data: any;
  type: string;
  shown: boolean = false;
  https: boolean = false;

  externalLinkService: any = {
    show: () => {}
  };

  @ViewChild(ActionSheetComponent) actionSheet: ActionSheetComponent;

  constructor(
    public incomingData: IncomingDataService,
    public zone: NgZone
  ) {
    this.incomingData.actionSheetObservable.subscribe((event) => {
      let data = event.data;
      if(event.action === 'show') {
        this.show(data.parsedData, data.type);
      }
    });
  }

  show(data, type) {
    this.data = data;
    this.type = type;
    this.handleNewData();
    setTimeout(() => {
      this.zone.run(() => {
        this.shown = true;
      });
    }, 750);
  }

  handleNewData() {
    if(this.type === 'url') {
      if(this.data.indexOf('https://') === 0) {
        this.https = true;
      }
    }
  }

  hide() {
    this.shown = false;
    this.incomingData.menuHidden();
  }

  goToUrl(url: string) {
    this.externalLinkService.open(url);
  }

  sendPaymentToAddress(bitcoinAddress: string) {
    this.shown = false;
    // $state.go('tabs.send').then(function() {
    //   $timeout(function() {
    //     $state.transitionTo('tabs.send.amount', {toAddress: bitcoinAddress});
    //   }, 50);
    // });
  }
  addToAddressBook(bitcoinAddress) {
    this.shown = false;
    // $timeout(function() {
    //   $state.go('tabs.send').then(function() {
    //     $timeout(function() {
    //       $state.transitionTo('tabs.send.addressbook', {addressbookEntry: bitcoinAddress});
    //     });
    //   });
    // }, 100);
  };
}
