import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config/config';
import { Logger } from '../../providers/logger/logger';

@Component({
  selector: 'page-pin',
  templateUrl: 'pin.html',
})
export class PinModalPage {

  private ATTEMPT_LIMIT: number;
  private ATTEMPT_LOCK_OUT_TIME: number;
  public currentAttempts: number;
  public currentPin: string;
  public firstPinEntered: string;
  public confirmingPin: boolean;
  public action: string;
  public disableButtons: boolean;
  public expires: string;
  public incorrect: boolean;
  public unregister: any;
  public showPinModal: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private platform: Platform,
    private events: Events
  ) {

    this.events.subscribe('showPinModalEvent', (action: string) => {

      this.ATTEMPT_LIMIT = 3;
      this.ATTEMPT_LOCK_OUT_TIME = 5 * 60;
      this.currentAttempts = 0;
      this.currentPin = '';
      this.firstPinEntered = '';
      this.confirmingPin = false;
      this.action = '';
      this.disableButtons = false;
      this.expires = '';
      this.incorrect = false;

      this.showPinModal = true;
      this.unregister = this.platform.registerBackButtonAction(() => { });

      this.action = action;

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
    });
  }

  public close(): void {
    this.events.publish('finishPinModalEvent');
    this.showPinModal = false;
    this.unregister();
  }

  public newEntry(value: string): void {
    if (this.disableButtons) return;
    this.incorrect = false;
    this.currentPin = this.currentPin + value;
    if (!this.isComplete()) return;
    if (this.action === 'checkPin' || this.action === 'removeLock') {
      setTimeout(() => {
        this.checkIfCorrect()
      }, 100);
    };
    if (this.action === 'pinSetUp') {
      setTimeout(() => {
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
      }, 100);
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
    this.close();
  }

  private checkIfCorrect(): void {
    let config = this.configProvider.get();
    let pinValue = config.lock && config.lock.value;
    if (pinValue == this.currentPin) {
      if (this.action === 'removeLock') {
        let lock = { method: 'Disabled', value: null, bannedUntil: null };
        this.configProvider.set({ lock });
        this.close();
      }
      if (this.action === 'checkPin') {
        this.close();
      }
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
    let lock = { bannedUntil };
    this.configProvider.set({ lock });
  }

}
