import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config/config';
import { Logger } from '../../providers/logger/logger';

import { PersistenceProvider } from '../../providers/persistence/persistence';

@Component({
  selector: 'page-pin',
  templateUrl: 'pin.html',
})
export class PinModalPage {

  private ATTEMPT_LIMIT: number;
  private ATTEMPT_LOCK_OUT_TIME: number;
  private countDown: any;
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
    private events: Events,
    private persistenceProvider: PersistenceProvider
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
        this.persistenceProvider.getLockStatus().then((isLocked: string) => {
          if (!isLocked) return;
          this.showLocktimer();
          this.setLockRelease();
        });
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
      this.persistenceProvider.setLockStatus('locked');
      this.showLocktimer();
      this.setLockRelease();
    }
  }

  private showLocktimer() {
    this.disableButtons = true;
    let bannedUntil = Math.floor(Date.now() / 1000) + this.ATTEMPT_LOCK_OUT_TIME;
    this.countDown = setInterval(() => {
      let now = Math.floor(Date.now() / 1000);
      let totalSecs = bannedUntil - now;
      let m = Math.floor(totalSecs / 60);
      let s = totalSecs % 60;
      this.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    }, 1000);
  }

  private setLockRelease() {
    setTimeout(() => {
      clearInterval(this.countDown);
      this.unlock();
    }, this.ATTEMPT_LOCK_OUT_TIME * 1000);
  }

  private unlock() {
    this.expires = this.disableButtons = null;
    this.currentPin = this.firstPinEntered = '';
    this.persistenceProvider.removeLockStatus();
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
    let lock = { method: 'pin', value: this.currentPin, bannedUntil: null };
    this.configProvider.set({ lock });
    this.close();
  }

  private checkIfCorrect(): void {
    let config = this.configProvider.get();
    let pinValue = config.lock && config.lock.value;
    if (pinValue == this.currentPin) {
      if (this.action === 'removeLock') {
        let lock = { method: 'disabled', value: null, bannedUntil: null };
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

}
