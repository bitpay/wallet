import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { AppProvider } from '../../../providers/app/app';
import * as _ from 'lodash';

@Component({
  selector: 'page-create-wallet',
  templateUrl: 'create-wallet.html'
})
export class CreateWalletPage implements OnInit{
  public formData: any;
  public showAdvOpts: boolean;
  public COPAYER_PAIR_LIMITS: Array<any>;
  public copayers: any;
  public signatures: any;
  public seedOptions: any;
  public isShared: boolean;
  public title: string;

  private appName: string;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private createForm: FormGroup;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    private app: AppProvider,
    private fb: FormBuilder
  ) {
    this.isShared = navParams.get('isShared');
    this.title = this.isShared ? 'Create shared wallet' : 'Create personal wallet';
    this.derivationPathByDefault = "m/44'/0'/0'";
    this.derivationPathForTestnet = "m/44'/1'/0'";
    this.showAdvOpts = false;
    this.COPAYER_PAIR_LIMITS = [2, 3, 4, 5, 6];
    this.copayers = _.clone(this.COPAYER_PAIR_LIMITS);
    this.signatures = _.clone(this.COPAYER_PAIR_LIMITS);
    this.formData = {
      walletName: null,
      copayerName: null,
      copayerSelected: this.copayers[0],
      signatureSelected: this.copayers[0],
      bwsURL: 'https://bws.bitpay.com/bws/api',
      recoveryPhrase: null,
      addPassword: false,
      password: null,
      confirmPassword: null,
      recoveryPhraseBackedUp: null,
      derivationPath: this.derivationPathByDefault,
      testnet: false,
      singleAddress: false,
    };
    this.appName = this.app.info.name;
    this.updateSeedSourceSelect(1);
  }

  ngOnInit() {
    this.createForm = this.fb.group({
      walletName: ['', Validators.required],
      copayerName: [''],
      copayerSelected: [''],
      signatureSelected: [''],
      bwsURL: [''],
      selectedSeed: [''],
      recoveryPhrase: [''],
      addPassword: [''],
      password: [''],
      confirmPassword: [''],
      recoveryPhraseBackedUp: [''],
      derivationPath: [''],
      testnet: [''],
      singleAddress: [''],
    });

    if (this.isShared) {
      this.createForm.get('copayerName').setValidators([Validators.required]);
    }

    this.createForm.get('addPassword').valueChanges.subscribe((addPassword: boolean) => {
      if (addPassword) {
        this.createForm.get('password').setValidators([Validators.required]);
        this.createForm.get('confirmPassword').setValidators([Validators.required]);
      }else {
        this.createForm.get('password').clearValidators();
        this.createForm.get('confirmPassword').clearValidators();
      }
      this.createForm.get('password').updateValueAndValidity();
      this.createForm.get('confirmPassword').updateValueAndValidity();
    })
  }

  validatePasswords() {
    if (this.formData.addPassword) {
      if (this.formData.password == this.formData.confirmPassword) {
        if (this.formData.recoveryPhraseBackedUp) return false;
      }
      return true;
    }
    return false;
  }

  updateSeedSourceSelect(n: number) {
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

    /* Disable Hardware Wallets for BitPay distribution */
    var opts = [];

    if (this.appName == 'copay') {
      // if (n > 1 && walletService.externalSource.ledger.supported)
      //   opts.push({
      //     id: walletService.externalSource.ledger.id,
      //     label: walletService.externalSource.ledger.longName,
      //     supportsTestnet: walletService.externalSource.ledger.supportsTestnet
      //   });

      // if (walletService.externalSource.trezor.supported) {
      //   opts.push({
      //     id: walletService.externalSource.trezor.id,
      //     label: walletService.externalSource.trezor.longName,
      //     supportsTestnet: walletService.externalSource.trezor.supportsTestnet
      //   });
      // }

      // if (walletService.externalSource.intelTEE.supported) {
      //   opts.push({
      //     id: walletService.externalSource.intelTEE.id,
      //     label: walletService.externalSource.intelTEE.longName,
      //     supportsTestnet: walletService.externalSource.intelTEE.supportsTestnet
      //   });
      // }
    }
    this.seedOptions = this.seedOptions.concat(opts);
  };

  seedOptionsChange(seed: any) {
    this.formData.selectedSeed.id = seed;
    this.formData.testnet = false;
    this.formData.derivationPath = this.derivationPathByDefault;
    this.resetFormFields();
  }

  copayersChange(copayer: any) {
    console.log(copayer);
  }

  signaturesChange(signature: any) {
    // TODO modify based on copayers
    console.log(signature);
  }  

  resetFormFields() {
    this.formData.password = null;
    this.formData.confirmPassword = null;
    this.formData.recoveryPhraseBackedUp = null;
    this.formData.recoveryPhrase = null;
  }

  setDerivationPath() {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  create() {
    console.log(this.formData);
  }
}
