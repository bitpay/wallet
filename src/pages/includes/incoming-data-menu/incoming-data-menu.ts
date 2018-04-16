import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';

@Component({
  selector: 'incoming-data-menu',
  templateUrl: 'incoming-data-menu.html',
})
export class IncomingDataMenuPage {
  public https: boolean;
  public data: string;
  public type: string;
  public coin: string;
  public showIncomingDataMenu: boolean;
  public showSlideEffect: boolean;

  constructor(
    private events: Events,
    private platform: Platform
  ) {
    this.https = false;
    this.showIncomingDataMenu = false;
    this.showSlideEffect = false
    this.events.subscribe('showIncomingDataMenuEvent', (data: any) => {
      this.showIncomingDataMenu = true;
      this.data = data.data;
      this.type = data.type;
      this.coin = data.coin;
      if (this.type === 'url') {
        if (this.data.indexOf('https://') === 0) {
          this.https = true;
        }
      }

      setTimeout(() => {
        this.showSlideEffect = true;
      }, 50);

      let unregisterBackButtonAction = this.platform.registerBackButtonAction(() => {
        unregisterBackButtonAction();
        this.backdropDismiss();
      }, 0);
    });
  }

  public backdropDismiss(): void {
    this.close(null, null);
  }

  public close(redirTo: string, value: string) {
    if (redirTo == 'AmountPage') {
      let coin = this.coin ? this.coin : 'btc';
      this.events.publish('finishIncomingDataMenuEvent', { redirTo, value, coin });
      return;
    } else {
      this.events.publish('finishIncomingDataMenuEvent', { redirTo, value });
    }

    this.showSlideEffect = false;
    setTimeout(() => {
      this.showIncomingDataMenu = false;
    }, 150);
  }

}