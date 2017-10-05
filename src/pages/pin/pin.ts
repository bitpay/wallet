import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config/config';
import { Logger } from '@nsalaun/ng-logger';

import * as _ from 'lodash';

@Component({
  selector: 'page-pin',
  templateUrl: 'pin.html',
})
export class PinModalPage {

  public currentPin: string = '';
  public firstPinEntered: string = '';
  public confirmingPin: boolean = false;
  public action: string = '';
  public appName: string = 'copay';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private config: ConfigProvider,
    private logger: Logger,
    public viewCtrl: ViewController
  ) {

    switch (this.navParams.get('action')) {
      case 'checkPin':
        this.action = 'checkPin';
        break;
      case 'pinSetUp':
        this.action = 'pinSetUp';
        break;
      case 'removeLock':
        this.action = 'removeLock'
    }

  }

  goBack(): void {
    this.navCtrl.pop();
  }

  newEntry(value: string): void {
    this.currentPin = this.currentPin + value;
    if (!this.isComplete()) return;
    if (this.action === 'checkPin' || this.action === 'removeLock') this.checkIfCorrect();
    if (this.action === 'pinSetUp') {
      if (!this.confirmingPin) {
        this.confirmingPin = true;
        this.firstPinEntered = this.currentPin;
        this.currentPin = '';
      }
      else if (this.firstPinEntered === this.currentPin) this.save();
      else {
        this.firstPinEntered = this.currentPin = '';
      }
    }
  }

  delete(): void {
    this.currentPin = this.currentPin.substring(0, this.currentPin.length - 1);
  }

  isComplete(): boolean {
    if (this.currentPin.length < 4) return false;
    else return true;
  };

  save(): void {
    let lock = { method: 'PIN', value: this.currentPin, bannedUntil: null };
    this.config.set({ lock });
    this.viewCtrl.dismiss();
  }

  checkIfCorrect(): void {
    let config = this.config.get();
    let pinValue = config['lock'] && config['lock']['value'];
    if (pinValue == this.currentPin) {
      if (this.action === 'removeLock') {
        let lock = { method: 'Disabled', value: null, bannedUntil: null };
        this.config.set({ lock });
        this.viewCtrl.dismiss();
      }
      if (this.action === 'checkPin') this.viewCtrl.dismiss();
    }
    else this.currentPin = '';
  }

  getFilledClass(limit): string {
    return this.currentPin.length >= limit ? 'filled-' + this.appName : null;
  }

}
