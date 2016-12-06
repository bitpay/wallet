import { Component, ViewChild } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';

import { IncomingDataMenuComponent } from '../components/incoming-data-menu/incoming-data-menu.component';

//<action-sheet (onHide)="onActionSheetHide()" [shown]="actionSheetShown"></action-sheet>


@Component({
  template: `
  <incoming-data-menu></incoming-data-menu>
  <ion-nav [root]="rootPage"></ion-nav>
  `
})
export class CopayApp {
  rootPage = TabsPage;
  actionSheetShown: boolean = false;

  @ViewChild(IncomingDataMenuComponent) incomingDataMenu: IncomingDataMenuComponent;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      setTimeout(() => {
       this.incomingDataMenu.show('https://bitpay.com', 'bitcoinAddress');
      }, 2000);
    });
  }

  onActionSheetHide() {
    console.log('onActionSheetHide called');
  }
}
