import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '../../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

// Pages
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
    private walletProvider: WalletProvider,
    private translate: TranslateService
  ) {

    this.isShared = this.navParams.get('isShared');
    this.title = this.isShared ? 'Create shared wallet' : 'Create personal wallet';
    this.defaults = this.configProvider.getDefaults();
    this.tc = this.isShared ? this.defaults.wallet.totalCopayers : 1;

    this.copayers = _.range(2, this.defaults.limits.totalCopayers + 1);
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;

    this.createForm = this.fb.group({
      walletName: [null, Validators.required],
      myName: [null],
      totalCopayers: [1],
      requiredCopayers: [1],
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [this.derivationPathByDefault],
      testnetEnabled: [false],
      singleAddress: [false],
      coin: [this.navParams.data.coin]
    });

    this.setTotalCopayers(this.tc);
    this.updateRCSelect(this.tc);
  }

  ngOnInit() {
    if (this.isShared) {
      this.createForm.get('myName').setValidators([Validators.required]);
    }
  }

  public setTotalCopayers(n: number): void {
    this.createForm.controls['totalCopayers'].setValue(n);
    this.updateRCSelect(n);
    this.updateSeedSourceSelect();
  };

  private updateRCSelect(n: number): void {
    this.createForm.controls['totalCopayers'].setValue(n);
    var maxReq = this.COPAYER_PAIR_LIMITS[n];
    this.signatures = _.range(1, maxReq + 1);
    this.createForm.controls['requiredCopayers'].setValue(Math.min(Math.trunc(n / 2 + 1), maxReq));

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
    this.createForm.controls['selectedSeed'].setValue(this.seedOptions[0].id); // new or set    
  };

  public seedOptionsChange(seed: any): void {
    if (seed === 'set') {
      this.createForm.get('recoveryPhrase').setValidators([Validators.required]);
    } else {
      this.createForm.get('recoveryPhrase').setValidators(null);
    }
    this.createForm.controls['selectedSeed'].setValue(seed); // new or set
    this.createForm.controls['testnet'].setValue(false);
    this.createForm.controls['derivationPath'].setValue(this.derivationPathByDefault);
    this.createForm.controls['recoveryPhrase'].setValue(null);
  }

  public setDerivationPath(): void {
    let path: string = this.createForm.value.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
    this.createForm.controls['derivationPath'].setValue(path);
  }

  public setOptsAndCreate(): void {

    let opts: any = {
      name: this.createForm.value.walletName,
      m: this.createForm.value.requiredCopayers,
      n: this.createForm.value.totalCopayers,
      myName: this.createForm.value.totalCopayers > 1 ? this.createForm.value.myName : null,
      networkName: this.createForm.value.testnetEnabled && this.createForm.value.coin != 'bch' ? 'testnet' : 'livenet',
      bwsurl: this.createForm.value.bwsurl,
      singleAddress: this.createForm.value.singleAddress,
      coin: this.createForm.value.coin
    };

    let setSeed = this.createForm.value.selectedSeed == 'set';
    if (setSeed) {

      let words = this.createForm.value.recoveryPhrase || '';
      if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }

      let pathData = this.derivationPathHelperProvider.parse(this.createForm.value.derivationPath);
      if (!pathData) {
        let title = this.translate.instant('Error');
        let subtitle = this.translate.instant('Invalid derivation path');
        this.popupProvider.ionicAlert(title, subtitle);
        return;
      }

      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Please enter the wallet recovery phrase');
      this.popupProvider.ionicAlert(title, subtitle);
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

      if (this.createForm.value.selectedSeed == 'set') {
        this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      }

      if (!wallet.isComplete()) {
        this.navCtrl.popToRoot({ animate: false });
        this.navCtrl.push(CopayersPage, { walletId: wallet.credentials.walletId });
      } else {
        this.navCtrl.popToRoot({ animate: false });
      }
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('creatingWallet', false);
      this.logger.warn(err);
      let title = this.translate.instant('Error');
      this.popupProvider.ionicAlert(title, err);
      return;
    });
  }

}
