import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';


@Component({
  template: `
    <action-sheet (onHide)="onActionSheetHide()" [shown]="actionSheetShown"></action-sheet>
    <ion-nav [root]="rootPage"></ion-nav>
  `
})
export class CopayApp {
  rootPage = TabsPage;
  actionSheetShown: boolean = false;

  constructor(platform: Platform) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      setTimeout(() => this.actionSheetShown = true, 3000);
    });
  }

  onActionSheetHide() {
    console.log('onActionSheetHide called');
  }
}
