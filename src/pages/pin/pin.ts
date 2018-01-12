import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config/config';
import { Logger } from '@nsalaun/ng-logger';

@Component({
  selector: 'page-pin',
  templateUrl: 'pin.html',
})
export class PinModalPage {

  private ATTEMPT_LIMIT: number = 3;
  private ATTEMPT_LOCK_OUT_TIME: number = 5 * 60;
  public currentAttempts: number = 0;
  public currentPin: string = '';
  public firstPinEntered: string = '';
  public confirmingPin: boolean = false;
  public action: string = '';
  public disableButtons: boolean = false;
  public expires: string = '';
  public incorrect: boolean;

  constructor(
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private viewCtrl: ViewController
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

    if (this.action === 'checkPin' || this.action === 'removeLock') {
      let config = this.configProvider.get();
      let bannedUntil = config.lock.bannedUntil;
      if (bannedUntil) {
        let now = Math.floor(Date.now() / 1000);
        if (now < bannedUntil) {
          this.disableButtons = true;
          this.lockTimeControl(bannedUntil);
        }
      }
    }
  }

  public close(): void {
    this.viewCtrl.dismiss();
  }

  public newEntry(value: string): void {
    if (this.disableButtons) return;
    this.incorrect = false;
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
        this.incorrect = true;
        this.confirmingPin = false;
      }
    }
  }

  private checkAttempts(): void {
    this.currentAttempts += 1;
    this.logger.info('Attempts to unlock:', this.currentAttempts);
    this.incorrect = true;
    if (this.currentAttempts == this.ATTEMPT_LIMIT) {
      this.currentAttempts = 0;
      let bannedUntil = Math.floor(Date.now() / 1000) + this.ATTEMPT_LOCK_OUT_TIME;
      this.saveFailedAttempt(bannedUntil);
      this.lockTimeControl(bannedUntil);
    }
  }

  private lockTimeControl(bannedUntil): void {
    this.setExpirationTime(bannedUntil, null);
    var countDown = setInterval(() => {
      this.setExpirationTime(bannedUntil, countDown);
    }, 1000);
  }

  private setExpirationTime(bannedUntil, countDown) {
    let now = Math.floor(Date.now() / 1000);
    if (now > bannedUntil) {
      if (countDown) this.reset(countDown);
    } else {
      this.disableButtons = true;
      let totalSecs = bannedUntil - now;
      let m = Math.floor(totalSecs / 60);
      let s = totalSecs % 60;
      this.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    }
  }

  private reset(countDown) {
    this.expires = this.disableButtons = null;
    this.currentPin = this.firstPinEntered = '';
    clearInterval(countDown);
  }

  public delete(): void {
    if (this.disableButtons) return;
    this.currentPin = this.currentPin.substring(0, this.currentPin.length - 1);
  }

  private isComplete(): boolean {
    if (this.currentPin.length < 4) return false;
    else return true;
  }

  public save(): void {
    let lock = { method: 'PIN', value: this.currentPin, bannedUntil: null };
    this.configProvider.set({ lock });
    this.viewCtrl.dismiss();
  }

  private checkIfCorrect(): void {
    let config = this.configProvider.get();
    let pinValue = config.lock && config.lock.value;
    if (pinValue == this.currentPin) {
      if (this.action === 'removeLock') {
        let lock = { method: 'Disabled', value: null, bannedUntil: null };
        this.configProvider.set({ lock });
        this.viewCtrl.dismiss();
      }
      if (this.action === 'checkPin') this.viewCtrl.dismiss();
    }
    else {
      this.currentPin = '';
      this.checkAttempts();
    }
  }

  public getFilledClass(limit): string {
    return this.currentPin.length >= limit ? 'filled' : null;
  }

  private saveFailedAttempt(bannedUntil) {
    let lock = { bannedUntil: bannedUntil };
    this.configProvider.set({ lock });
  }

}
