import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Navbar, NavController, NavParams, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// pages
import { DisclaimerPage } from '../../onboarding/disclaimer/disclaimer';

// providers
import { BwcProvider } from '../../../providers/bwc/bwc';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-backup-game',
  templateUrl: 'backup-game.html'
})
export class BackupGamePage {
  @ViewChild(Slides) slides: Slides;
  @ViewChild(Navbar) navBar: Navbar;

  private fromOnboarding: boolean;

  public currentIndex: number;
  public deleted: boolean;
  public mnemonicWords: string[];
  public shuffledMnemonicWords;
  public password: string;
  public customWords;
  public selectComplete: boolean;
  public error: boolean;
  public credentialsEncrypted: boolean;

  private mnemonicHasPassphrase;
  private walletId: string;
  private wallet;
  private keys;
  private useIdeograms;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private translate: TranslateService
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.credentialsEncrypted = this.wallet.isPrivKeyEncrypted();
  }

  ionViewDidEnter() {
    this.deleted = this.isDeletedSeed();
    if (this.deleted) {
      this.logger.debug('no mnemonics');
      return;
    }

    this.walletProvider
      .getKeys(this.wallet)
      .then(keys => {
        if (_.isEmpty(keys)) {
          this.logger.error('Empty keys');
        }
        this.credentialsEncrypted = false;
        this.keys = keys;
        this.setFlow();
      })
      .catch(err => {
        this.logger.error('Could not get keys: ', err);
        this.navCtrl.pop();
      });
  }

  ngOnInit() {
    this.currentIndex = 0;
    this.navBar.backButtonClick = () => {
      if (this.slides) this.slidePrev();
      else this.navCtrl.pop();
    };
  }

  ionViewDidLoad() {
    if (this.slides) this.slides.lockSwipes(true);
  }

  private shuffledWords(words: string[]) {
    var sort = _.sortBy(words);

    return _.map(sort, w => {
      return {
        word: w,
        selected: false
      };
    });
  }

  public addButton(index: number, item): void {
    var newWord = {
      word: item.word,
      prevIndex: index
    };
    this.customWords.push(newWord);
    this.shuffledMnemonicWords[index].selected = true;
    this.shouldContinue();
  }

  public removeButton(index: number, item): void {
    // if ($scope.loading) return;
    this.customWords.splice(index, 1);
    this.shuffledMnemonicWords[item.prevIndex].selected = false;
    this.shouldContinue();
  }

  private shouldContinue(): void {
    this.selectComplete =
      this.customWords.length === this.shuffledMnemonicWords.length
        ? true
        : false;
  }

  private isDeletedSeed(): boolean {
    if (
      !this.wallet.credentials.mnemonic &&
      !this.wallet.credentials.mnemonicEncrypted
    )
      return true;

    return false;
  }

  private slidePrev(): void {
    this.slides.lockSwipes(false);
    if (this.currentIndex == 0) this.navCtrl.pop();
    else {
      this.slides.slidePrev();
      this.currentIndex = this.slides.getActiveIndex();
    }
    this.slides.lockSwipes(true);
  }

  public slideNext(reset: boolean): void {
    if (reset) {
      this.resetGame();
    }

    if (this.currentIndex == 1 && !this.mnemonicHasPassphrase) this.finalStep();
    else {
      this.slides.lockSwipes(false);
      this.slides.slideNext();
    }

    this.currentIndex = this.slides.getActiveIndex();
    this.slides.lockSwipes(true);
  }

  private resetGame() {
    this.customWords = [];
    this.shuffledMnemonicWords.forEach(word => {
      word.selected = false;
    });
    this.selectComplete = false;
  }

  private setFlow(): void {
    if (!this.keys) return;

    let words = this.keys.mnemonic;

    this.mnemonicWords = words.split(/[\u3000\s]+/);
    this.shuffledMnemonicWords = this.shuffledWords(this.mnemonicWords);
    this.mnemonicHasPassphrase = this.wallet.mnemonicHasPassphrase();
    this.useIdeograms = words.indexOf('\u3000') >= 0;
    this.password = '';
    this.customWords = [];
    this.selectComplete = false;
    this.error = false;

    words = _.repeat('x', 300);

    if (this.currentIndex == 2) this.slidePrev();
  }

  private confirm(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.error = false;

      let customWordList = _.map(this.customWords, 'word');

      if (!_.isEqual(this.mnemonicWords, customWordList)) {
        return reject('Mnemonic string mismatch');
      }

      if (this.mnemonicHasPassphrase) {
        let walletClient = this.bwcProvider.getClient();
        let separator = this.useIdeograms ? '\u3000' : ' ';
        let customSentence = customWordList.join(separator);
        let password = this.password || '';

        try {
          walletClient.seedFromMnemonic(customSentence, {
            network: this.wallet.credentials.network,
            password,
            account: this.wallet.credentials.account
          });
        } catch (err) {
          walletClient.credentials.xPrivKey = _.repeat('x', 64);
          return reject(err);
        }

        if (
          walletClient.credentials.xPrivKey.substr(
            walletClient.credentials.xPrivKey
          ) != this.keys.xPrivKey
        ) {
          delete walletClient.credentials;
          return reject('Private key mismatch');
        }
      }

      this.profileProvider.setBackupFlag(this.wallet.credentials.walletId);
      return resolve();
    });
  }

  private finalStep(): void {
    this.onGoingProcessProvider.set('validatingWords');
    this.confirm()
      .then(() => {
        this.onGoingProcessProvider.clear();
        const modal = this.popupProvider.createMiniModal('backup-ready');
        modal.present({ animate: false });
        modal.onDidDismiss(() => {
          if (this.fromOnboarding) {
            this.navCtrl.push(DisclaimerPage);
          } else {
            this.navCtrl.popToRoot({ animate: false });
          }
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Failed to verify backup: ', err);
        this.error = true;
        let title = this.translate.instant('Uh oh...');
        let message = this.translate.instant(
          "It's important that you write your backup phrase down correctly. If something happens to your wallet, you'll need this backup to recover your money. Please review your backup and try again."
        );
        this.popupProvider.ionicAlert(title, message).then(() => {
          this.setFlow();
        });
      });
  }
}
