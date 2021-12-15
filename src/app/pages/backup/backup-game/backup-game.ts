import { Component, NgZone, ViewChild, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { Location } from '@angular/common';
// pages
import { AddFundsPage } from '../../onboarding/add-funds/add-funds';
import { DisclaimerPage } from '../../onboarding/disclaimer/disclaimer';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { KeyProvider } from '../../../providers/key/key';
import { Logger } from '../../../providers/logger/logger';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ProfileProvider } from '../../../providers/profile/profile';
import { IonSlides, NavController, NavParams } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import { SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';

@Component({
  selector: 'page-backup-game',
  templateUrl: 'backup-game.html',
  styleUrls: ['./backup-game.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BackupGamePage {
  @ViewChild('swiper', { static: true }) swiper: SwiperComponent;

  @ViewChild('wideHeader')
  wideHeader;
  config: SwiperOptions = {
    slidesPerView: 2,
    spaceBetween: 20,
    centeredSlides: true,
    speed: 400
  }
  public mnemonicWords: string[];
  public shuffledMnemonicWords;
  public password: string;
  public customWords;
  public selectComplete: boolean;
  public mnemonicHasPassphrase;
  public useIdeograms;
  public keys;
  public keyId: string;
  navParamsData;
  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private bwcProvider: BwcProvider,
    private actionSheetProvider: ActionSheetProvider,
    private keyProvider: KeyProvider,
    private persistenceProvider: PersistenceProvider,
    private events: EventManagerService,
    private router: Router,
    private location: Location,
    private zone: NgZone
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.mnemonicWords = this.navParamsData.words;
    this.keys = this.navParamsData.keys;
    this.keyId = this.navParamsData.keyId;
    this.setFlow();
  }

  ngAfterViewInit() {
    this.swiper.swiperRef.allowSlidePrev = false;
  }
  
  back() {
    if (this.customWords.length > 0) {
      this.clear();
    } else {
      this.location.back();
    }
  }

  private shuffledWords(words: string[]) {
    const sort = _.sortBy(words);

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
      this.swiper.swiperRef.allowTouchMove = false;
      this.swiper.swiperRef.slideNext();
    }, 300);
  }

  public removeButton(index: number, item): void {
    this.customWords.splice(index, 1);
    this.shuffledMnemonicWords[item.prevIndex].selected = false;
    this.shouldContinue();
    setTimeout(() => {
      this.swiper.swiperRef.allowTouchMove = false;
      this.swiper.swiperRef.slideNext();
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
      this.swiper.swiperRef.allowTouchMove = false;
      this.swiper.swiperRef.slideTo(0);
    }, 300);
  }

  private setFlow() {
    if (!this.mnemonicWords) return;

    this.shuffledMnemonicWords = this.shuffledWords(this.mnemonicWords);
    this.mnemonicHasPassphrase = this.keyProvider.mnemonicHasPassphrase(
      this.keyId
    );
    this.useIdeograms = this.mnemonicWords.indexOf('\u3000') >= 0;
    this.password = '';
    this.customWords = [];
    this.selectComplete = false;
  }

  public finalStep(): void {
    const customWordList = _.map(this.customWords, 'word');

    if (!_.isEqual(this.mnemonicWords, customWordList)) {
      this.showErrorInfoSheet('Mnemonic string mismatch');
      return;
    }

    if (this.mnemonicHasPassphrase) {
      const keyClient = this.bwcProvider.getKey();
      const separator = this.useIdeograms ? '\u3000' : ' ';
      const customSentence = customWordList.join(separator);
      const password = this.password || '';
      let key;

      try {
        key = new keyClient({
          seedType: 'mnemonic',
          seedData: customSentence,
          useLegacyCoinType: false,
          useLegacyPurpose: false,
          passphrase: password
        });
      } catch (err) {
        this.showErrorInfoSheet(err);
        return;
      }

      if (key.get().xPrivKey != this.keys.xPrivKey) {
        this.showErrorInfoSheet('Private key mismatch');
        return;
      }
    }
    this.profileProvider.setBackupGroupFlag(this.keyId);
    const opts = {
      keyId: this.keyId,
      showHidden: true
    };
    const wallets = this.profileProvider.getWalletsFromGroup(opts);
    wallets.forEach(w => {
      this.profileProvider.setWalletBackup(w.credentials.walletId);
    });
    this.showSuccessInfoSheet();
  }

  private showSuccessInfoSheet() {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'correct-recovery-prhase'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(() => {
      if (this.navParamsData.isOnboardingFlow) {
        this.persistenceProvider
          .getCopayDisclaimerFlag()
          .then(disclaimerAgreed => {
            const path = disclaimerAgreed ? '/add-funds' : '/disclaimer'
            this.router.navigate([path], {
              state: { keyId: this.keyId, },
              replaceUrl: true
            });
          });
      } else {
        this.router.navigate(['']).then(() => {
          this.events.publish('Local/FetchWallets');
        });
      }
    });
  }

  private showErrorInfoSheet(err) {
    this.logger.warn('Failed to verify backup: ', err);
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'incorrect-recovery-prhase'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(() => {
      this.clear();
      this.setFlow();
    });
  }
}
