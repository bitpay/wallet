import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ModalController,
  Navbar,
  NavController,
  NavParams,
  Slides
} from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { FinishModalPage } from '../../finish/finish';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-backup-game',
  templateUrl: 'backup-game.html'
})
export class BackupGamePage {
  @ViewChild('gameSlides')
  gameSlides: Slides;
  @ViewChild(Navbar)
  navBar: Navbar;

  public mnemonicWords: string[];
  public shuffledMnemonicWords;
  public password: string;
  public customWords;
  public selectComplete: boolean;
  public mnemonicHasPassphrase;
  public useIdeograms;
  public wallet;
  public keys;

  private walletId: string;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService
  ) {
    this.mnemonicWords = this.navParams.data.words;
    this.keys = this.navParams.data.keys;
    this.walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.setFlow();
  }

  ionViewDidLoad() {
    if (this.gameSlides) this.gameSlides.lockSwipes(true);
    this.navBar.backButtonClick = () => {
      if (this.customWords.length > 0) {
        this.clear();
      } else {
        this.navCtrl.pop();
      }
    };
  }

  private shuffledWords(words: string[]) {
    const sort = _.shuffle(words);

    return _.map(sort, w => {
      return {
        word: w,
        selected: false
      };
    });
  }

  public addButton(index: number, item): void {
    const newWord = {
      word: item.word,
      prevIndex: index
    };
    this.customWords.push(newWord);
    this.shuffledMnemonicWords[index].selected = true;
    this.shouldContinue();
    setTimeout(() => {
      this.gameSlides.lockSwipes(false);
      this.gameSlides.slideNext();
      this.gameSlides.lockSwipes(true);
    }, 300);
  }

  public removeButton(index: number, item): void {
    this.customWords.splice(index, 1);
    this.shuffledMnemonicWords[item.prevIndex].selected = false;
    this.shouldContinue();
    setTimeout(() => {
      this.gameSlides.lockSwipes(false);
      this.gameSlides.slidePrev();
      this.gameSlides.lockSwipes(true);
    }, 300);
  }

  private shouldContinue(): void {
    this.selectComplete =
      this.customWords.length === this.shuffledMnemonicWords.length
        ? true
        : false;
  }

  public clear(): void {
    this.customWords = [];
    this.shuffledMnemonicWords.forEach(word => {
      word.selected = false;
    });
    this.selectComplete = false;
    setTimeout(() => {
      this.gameSlides.lockSwipes(false);
      this.gameSlides.slideTo(0);
      this.gameSlides.lockSwipes(true);
    }, 300);
  }

  private setFlow(): void {
    if (!this.mnemonicWords) return;

    this.shuffledMnemonicWords = this.shuffledWords(this.mnemonicWords);
    this.mnemonicHasPassphrase = this.wallet.mnemonicHasPassphrase();
    this.useIdeograms = this.keys.mnemonic.indexOf('\u3000') >= 0;
    this.password = '';
    this.customWords = [];
    this.selectComplete = false;
  }

  private confirm(): Promise<any> {
    return new Promise((resolve, reject) => {
      const customWordList = _.map(this.customWords, 'word');

      if (!_.isEqual(this.mnemonicWords, customWordList)) {
        return reject('Mnemonic string mismatch');
      }

      if (this.mnemonicHasPassphrase) {
        const walletClient = this.bwcProvider.getClient();
        const separator = this.useIdeograms ? '\u3000' : ' ';
        const customSentence = customWordList.join(separator);
        const password = this.password || '';

        try {
          walletClient.seedFromMnemonic(customSentence, {
            network: this.wallet.credentials.network,
            passphrase: password,
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

  public finalStep(): void {
    this.onGoingProcessProvider.set('validatingWords');
    this.confirm()
      .then(async () => {
        this.onGoingProcessProvider.clear();
        const finishText = this.translate.instant(
          'Your recovery phrase is verified'
        );
        const finishComment = this.translate.instant(
          'Be sure to store your recovery phrase in a safe and secure place'
        );
        const cssClass = 'primary';
        const params = { finishText, finishComment, cssClass };
        const modal = this.modalCtrl.create(FinishModalPage, params, {
          showBackdrop: true,
          enableBackdropDismiss: false,
          cssClass: 'finish-modal'
        });
        await modal.present();
        modal.onDidDismiss(() => {
          this.navCtrl.popToRoot();
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Failed to verify backup: ', err);
        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'backup-failed'
        );
        infoSheet.present();
        infoSheet.onDidDismiss(() => {
          this.clear();
          this.setFlow();
        });
      });
  }
}
