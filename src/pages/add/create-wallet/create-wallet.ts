import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { HomePage } from '../../../pages/home/home';
import { CopayersPage } from '../copayers/copayers';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { ProfileProvider } from '../../../providers/profile/profile';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { PopupProvider } from '../../../providers/popup/popup';
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { WalletProvider } from '../../../providers/wallet/wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-create-wallet',
  templateUrl: 'create-wallet.html'
})
export class CreateWalletPage implements OnInit {

  /* For compressed keys, m*73 + n*34 <= 496 */
  private COPAYER_PAIR_LIMITS: any = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 4,
    6: 4,
    7: 3,
    8: 3,
    9: 2,
    10: 2,
    11: 1,
    12: 1,
  };

  private createForm: FormGroup;
  private defaults: any;
  private tc: number;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;

  public formData: any;
  public copayers: Array<number>;
  public signatures: Array<number>;
  public showAdvOpts: boolean;
  public seedOptions: any;
  public isShared: boolean;
  public title: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private fb: FormBuilder,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private walletProvider: WalletProvider
  ) {

    this.isShared = this.navParams.get('isShared');
    this.title = this.isShared ? 'Create shared wallet' : 'Create personal wallet';
    this.defaults = this.configProvider.getDefaults();
    this.tc = this.isShared ? this.defaults.wallet.totalCopayers : 1;

    this.copayers = _.range(2, this.defaults.limits.totalCopayers + 1);
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;

    this.formData = {
      walletName: null,
      myName: null,
      totalCopayers: 1,
      requiredCopayers: 1,
      bwsURL: this.defaults.bws.url,
      recoveryPhrase: null,
      addPassword: false,
      password: null,
      confirmPassword: null,
      recoveryPhraseBackedUp: null,
      derivationPath: this.derivationPathByDefault,
      testnetEnabled: false,
      singleAddress: false,
      coin: this.navParams.data.coin
    };

    this.setTotalCopayers(this.tc);
    this.updateRCSelect(this.tc);
    this.resetPasswordFields();
  }

  ngOnInit() {
    this.createForm = this.fb.group({
      walletName: ['', Validators.required],
      myName: [''],
      totalCopayers: [''],
      requiredCopayers: [''],
      bwsURL: [''],
      selectedSeed: [''],
      recoveryPhrase: [''],
      addPassword: [''],
      password: [''],
      confirmPassword: [''],
      recoveryPhraseBackedUp: [''],
      derivationPath: [''],
      testnetEnabled: [''],
      singleAddress: [''],
      coin: ['']
    });

    if (this.isShared) {
      this.createForm.get('myName').setValidators([Validators.required]);
    }

    this.createForm.get('addPassword').valueChanges.subscribe((addPassword: boolean) => {
      if (addPassword) {
        this.createForm.get('password').setValidators([Validators.required]);
        this.createForm.get('confirmPassword').setValidators([Validators.required]);
      } else {
        this.createForm.get('password').clearValidators();
        this.createForm.get('confirmPassword').clearValidators();
      }
      this.createForm.get('password').updateValueAndValidity();
      this.createForm.get('confirmPassword').updateValueAndValidity();
    });
  }

  public validatePasswords(): boolean {
    if (this.formData.addPassword) {
      if (this.formData.password == this.formData.confirmPassword) {
        if (this.formData.recoveryPhraseBackedUp) return false;
      }
      return true;
    }
    return false;
  }

  public setTotalCopayers(n: number): void {
    this.formData.totalCopayers = n;
    this.updateRCSelect(n);
    this.updateSeedSourceSelect();
  };

  private updateRCSelect(n: number): void {
    this.formData.totalCopayers = n;
    var maxReq = this.COPAYER_PAIR_LIMITS[n];
    this.signatures = _.range(1, maxReq + 1);
    this.formData.requiredCopayers = Math.min(Math.trunc(n / 2 + 1), maxReq);
  };

  private resetPasswordFields(): void {
    this.formData.password = this.formData.confirmPassword = this.formData.recoveryPhraseBackedUp = null;
  };

  private updateSeedSourceSelect(): void {
    this.seedOptions = [{
      id: 'new',
      label: 'Random',
      supportsTestnet: true
    }, {
      id: 'set',
      label: 'Specify Recovery Phrase',
      supportsTestnet: false
    }];
    this.formData.selectedSeed = {
      id: this.seedOptions[0].id
    };
  };

  public seedOptionsChange(seed: any): void {
    this.formData.selectedSeed.id = seed; // new or set
    this.formData.testnet = false;
    this.formData.derivationPath = this.derivationPathByDefault;
    this.resetFormFields();
  }

  public resetFormFields(): void {
    this.formData.password = null;
    this.formData.confirmPassword = null;
    this.formData.recoveryPhraseBackedUp = null;
    this.formData.recoveryPhrase = null;
  }

  public setDerivationPath(): void {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  public setOptsAndCreate(): void {

    let opts: any = {
      name: this.formData.walletName,
      m: this.formData.requiredCopayers,
      n: this.formData.totalCopayers,
      myName: this.formData.totalCopayers > 1 ? this.formData.myName : null,
      networkName: this.formData.testnetEnabled && this.formData.coin != 'bch' ? 'testnet' : 'livenet',
      bwsurl: this.formData.bwsurl,
      singleAddress: this.formData.singleAddressEnabled,
      coin: this.formData.coin
    };

    let setSeed = this.formData.selectedSeed.id == 'set';
    if (setSeed) {

      let words = this.formData.recoveryPhrase || '';
      if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }
      opts.passphrase = this.formData.password;

      let pathData = this.derivationPathHelperProvider.parse(this.formData.derivationPath);
      if (!pathData) {
        this.popupProvider.ionicAlert('Error', 'Invalid derivation path', 'Ok'); // TODO: GetTextCatalog
        return;
      }

      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

    } else {
      opts.passphrase = this.formData.password;
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      this.popupProvider.ionicAlert('Error', 'Please enter the wallet recovery phrase', 'Ok'); // TODO: GetTextCatalog
      return;
    }

    this.create(opts);
  }

  private create(opts: any): void {
    this.onGoingProcessProvider.set('creatingWallet', true);

    this.profileProvider.createWallet(opts).then((wallet: any) => {
      this.onGoingProcessProvider.set('creatingWallet', false);
      this.walletProvider.updateRemotePreferences(wallet);
      // TODO: this.pushNotificationsService.updateSubscription(wallet);

      if (this.formData.selectedSeed.id == 'set') {
        this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      }

      if (!wallet.isComplete()) {
        this.navCtrl.setRoot(HomePage);
        this.navCtrl.popToRoot();
        this.navCtrl.push(CopayersPage, { walletId: wallet.credentials.walletId });
      } else {
        this.navCtrl.setRoot(HomePage);
        this.navCtrl.popToRoot();
      }
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('creatingWallet', false);
      this.logger.warn(err);
      this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: GetTextCatalog
      return;
    });
  }

}
