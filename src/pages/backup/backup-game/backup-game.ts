import { Component, ViewChild } from '@angular/core';
import { NavController, Slides, Navbar, AlertController } from 'ionic-angular';
import { TabsPage } from '../../tabs/tabs';
import * as _ from 'lodash';

@Component({
  selector: 'page-backup-game',
  templateUrl: 'backup-game.html',
})
export class BackupGamePage {
  @ViewChild(Slides) slides: Slides;
  @ViewChild(Navbar) navBar: Navbar;

  public currentIndex: number;
  public deleted: boolean;
  public wallet: any;
  public mnemonicWords: Array<String>;
  public shuffledMnemonicWords: Array<any>;
  public passphrase: String;
  public customWords: Array<any>;
  public selectComplete: boolean;
  public error: boolean;

  private keys: any;
  private useIdeograms: any;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController
  ) {
    // TODO replace for the original wallet object
    this.wallet = {
      name: 'Wallet name',
      credentials: {
        mnemonic: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce',
        //mnemonic: 'turtle provide boat sick popular brisk test devote gossip embark endorse corn',
        mnemonicEncrypted: false,
      },
      n: 1,
      isPrivKeyEncrypted: this.isPrivKeyEncrypted(),
      mnemonicHasPassphrase: this.mnemonicHasPassphrase(),
      network: 'livenet',
    };

    // TODO waiting for bwc
    // walletService.getKeys($scope.wallet, function(err, k) {
    //   if (err || !k) {
    //     $log.error('Could not get keys: ', err);
    //     $ionicHistory.goBack();
    //     return;
    //   }
    //   $scope.credentialsEncrypted = false;
    //   keys = k;
    //   $scope.initFlow();
    // });
    this.keys = null;

    // this.deleted = this.isDeletedSeed();
    this.deleted = false;
  }

  ngOnInit() {
    this.currentIndex = 0;
    this.navBar.backButtonClick = (e: UIEvent) => {
      this.slidePrev();
    }
    this.initFlow();
  }

  ionViewDidLoad() {
  }

  initFlow() {
    // if (!this.keys) return;

    // var words = keys.mnemonic;
    var words = this.wallet.credentials.mnemonic;

    this.mnemonicWords = words.split(/[\u3000\s]+/);
    this.shuffledMnemonicWords = this.shuffledWords(this.mnemonicWords);
    this.useIdeograms = words.indexOf("\u3000") >= 0;
    this.passphrase = null;
    this.customWords = [];
    this.selectComplete = false;
    this.error = false;

    if (this.currentIndex == 2) this.slidePrev();
  };

  shuffledWords(words: Array<String>) {
    var sort = _.sortBy(words);

    return _.map(sort, (w) => {
      return {
        word: w,
        selected: false
      };
    });
  };

  addButton(index: number, item: any) {
    var newWord = {
      word: item.word,
      prevIndex: index
    };
    this.customWords.push(newWord);
    this.shuffledMnemonicWords[index].selected = true;
    this.shouldContinue();
  };

  removeButton(index: number, item: any) {
    // if ($scope.loading) return;
    this.customWords.splice(index, 1);
    this.shuffledMnemonicWords[item.prevIndex].selected = false;
    this.shouldContinue();
  };

  shouldContinue() {
    if (this.customWords.length == this.shuffledMnemonicWords.length)
      this.selectComplete = true;
    else
      this.selectComplete = false;
  };

  finalStep() {
    // ongoingProcess.set('validatingWords', true);
    this.confirm((err) => {
      // ongoingProcess.set('validatingWords', false);
      if (err) {
        this.backupError(err);
      }
      setTimeout(() => {
        this.showBackupResult();
        return;
      });
    });
  };

  confirm(cb: Function) {
    this.error = false;

    var customWordList = _.map(this.customWords, 'word');

    if (!_.isEqual(this.mnemonicWords, customWordList)) {
      return cb('Mnemonic string mismatch');
    }

    setTimeout(() => {
      // TODO waiting for bwc
      // if (this.mnemonicHasPassphrase) {
      //   var walletClient = bwcService.getClient();
      //   var separator = this.useIdeograms ? '\u3000' : ' ';
      //   var customSentence = customWordList.join(separator);
      //   var passphrase = this.data.passphrase || '';
      //
      //   try {
      //     walletClient.seedFromMnemonic(customSentence, {
      //       network: this.wallet.credentials.network,
      //       passphrase: passphrase,
      //       account: this.wallet.credentials.account
      //     });
      //   } catch (err) {
      //     walletClient.credentials.xPrivKey = _.repeat('x', 64);
      //     return cb(err);
      //   }
      //
      //   if (walletClient.credentials.xPrivKey.substr(walletClient.credentials.xPrivKey) != keys.xPrivKey) {
      //     delete walletClient.credentials;
      //     return cb('Private key mismatch');
      //   }
      // }

      // profileService.setBackupFlag($scope.wallet.credentials.walletId);
      return cb();
    });
  };

  backupError(err: any) {
    // ongoingProcess.set('validatingWords', false);
    console.log('Failed to verify backup: ', err);
    this.error = true;
  };

  showBackupResult() {
    if (this.error) {
      let alert = this.alertCtrl.create({
        title: "Uh oh...",
        subTitle: "It's important that you write your backup phrase down correctly. If something happens to your wallet, you'll need this backup to recover your money. Please review your backup and try again.",
        buttons: [{
          text: 'Ok',
          role: 'cancel',
          handler: () => {
            this.initFlow();
          }
        }]
      });
      alert.present();
    } else {
      let opts = {
        title: 'Your bitcoin wallet is backed up!',
        message: 'Be sure to store your recovery phrase in a secure place. If this app is deleted, your money cannot be recovered without it.',
        buttons: [{
          text: 'Got it',
          handler: () => {
            this.navCtrl.setRoot(TabsPage);
            this.navCtrl.popToRoot();
          }
        }],
      }
      this.alertCtrl.create(opts).present();
    }
  };

  /*********************************
  * Hardcoded methods
  */

  mnemonicHasPassphrase() {
    return false;
  }

  isPrivKeyEncrypted() {
    return false;
  }

  /*
  * Hardcoded methods
  *********************************/

  isDeletedSeed() {
    if (!this.wallet.credentials.mnemonic && !this.wallet.credentials.mnemonicEncrypted)
      return true;

    return false;
  }

  slidePrev() {
    if (this.currentIndex == 0) this.navCtrl.pop();
    else {
      this.slides.slidePrev();
      this.currentIndex = this.slides.getActiveIndex();
    }
  }

  slideNext() {
    if (this.currentIndex == 1 && !this.wallet.mnemonicHasPassphrase)
      this.finalStep();
    else
      this.slides.slideNext();

    this.currentIndex = this.slides.getActiveIndex();
  }

}
