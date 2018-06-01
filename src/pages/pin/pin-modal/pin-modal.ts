import { Component, ViewChild } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { Vibration } from '@ionic-native/vibration';
import {
  NavController,
  NavParams,
  Platform,
  ViewController
} from 'ionic-angular';

import { Animate } from '../../../directives/animate/animate';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';

@Component({
  selector: 'page-pin',
  templateUrl: 'pin-modal.html'
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

  @ViewChild(Animate) pinCode: Animate;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private platform: Platform,
    private navCtrl: NavController,
    private navParams: NavParams,
    private persistenceProvider: PersistenceProvider,
    private statusBar: StatusBar,
    private vibration: Vibration,
    private viewCtrl: ViewController
  ) {
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

    this.unregister = this.platform.registerBackButtonAction(() => {});

    this.action = this.navParams.get('action');

    if (this.action === 'checkPin' || this.action === 'lockSetUp') {
      this.persistenceProvider.getLockStatus().then((isLocked: string) => {
        if (!isLocked) return;
        if (this.action === 'checkPin') {
          this.showLockTimer();
          this.setLockRelease();
        }
      });
    }
  }

  ionViewWillEnter() {
    if (this.platform.is('ios')) {
      this.statusBar.styleDefault();
    }
  }

  ionViewWillLeave() {
    if (this.platform.is('ios')) {
      this.statusBar.styleLightContent();
    }
  }

  public close(cancelClicked?: boolean): void {
    if (this.countDown) {
      clearInterval(this.countDown);
    }
    this.unregister();
    if (this.action === 'lockSetUp') this.viewCtrl.dismiss(cancelClicked);
    else this.navCtrl.pop({ animate: true });
  }

  public newEntry(value: string): void {
    if (this.disableButtons) return;
    if (value === 'delete') {
      return this.delete();
    }
    this.incorrect = false;
    this.currentPin = this.currentPin + value;
    if (!this.isComplete()) return;
    if (this.action === 'checkPin' || this.action === 'lockSetUp') {
      setTimeout(() => {
        this.checkIfCorrect();
      }, 100);
    }
    if (this.action === 'pinSetUp') {
      setTimeout(() => {
        if (!this.confirmingPin) {
          this.confirmingPin = true;
          this.firstPinEntered = this.currentPin;
          this.currentPin = '';
        } else if (this.firstPinEntered === this.currentPin) this.save();
        else {
          this.firstPinEntered = this.currentPin = '';
          this.incorrect = true;
          this.confirmingPin = false;
          this.shakeCode();
        }
      }, 100);
    }
  }

  private checkAttempts(): void {
    this.currentAttempts += 1;
    this.logger.info('Attempts to unlock:', this.currentAttempts);
    this.incorrect = true;
    if (
      this.currentAttempts == this.ATTEMPT_LIMIT &&
      this.action !== 'lockSetUp'
    ) {
      this.currentAttempts = 0;
      this.persistenceProvider.setLockStatus('locked');
      this.showLockTimer();
      this.setLockRelease();
    }
  }

  private showLockTimer() {
    this.disableButtons = true;
    let bannedUntil =
      Math.floor(Date.now() / 1000) + this.ATTEMPT_LOCK_OUT_TIME;
    this.countDown = setInterval(() => {
      let now = Math.floor(Date.now() / 1000);
      let totalSecs = bannedUntil - now;
      let m = Math.floor(totalSecs / 60);
      let s = totalSecs % 60;
      this.expires = ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
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
      if (this.action === 'checkPin' || this.action === 'lockSetUp') {
        this.close();
      }
    } else {
      this.currentPin = '';
      this.checkAttempts();
      this.shakeCode();
    }
  }

  public shakeCode() {
    this.pinCode.animate('shake');
    this.vibration.vibrate(100);
  }
}
