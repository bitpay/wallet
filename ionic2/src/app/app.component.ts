import { Component, ViewChild } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';

import { IncomingDataMenuComponent } from '../components/incoming-data-menu/incoming-data-menu.component';

import { IncomingDataService } from '../services/incoming-data.service';

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

  constructor(
    public incomingData: IncomingDataService,
    public platform: Platform
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      // setTimeout(() => {
      //  this.incomingDataMenu.show('http://bitpay.com', 'url');
      // }, 2000);
      // this.incomingData.actionSheetObservable.subscribe((data) => {
      //   console.log('incoming data subscribe', data);
      //   this.incomingDataMenu.show(data.parsedData, data.type);
      // });
    });
  }

  onActionSheetHide() {
    console.log('onActionSheetHide called');
  }
}
