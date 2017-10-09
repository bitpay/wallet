import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { AppProvider } from '../../../providers/app/app';

@Component({
  selector: 'page-single-wallet',
  templateUrl: 'single-wallet.html'
})
export class SingleWalletPage implements OnInit{
  public formData: any;
  public showAdvOpts: boolean;
  public seedOptions: any;

  private appName: string;
  private createForm: FormGroup;

  constructor(
    public navCtrl: NavController, 
    private app: AppProvider,
    private fb: FormBuilder
  ) {
    this.showAdvOpts = false;
    this.formData = {
      walletName: null,
      bwsURL: 'https://bws.bitpay.com/bws/api',
      addPassword: false,
      password: null,
      confirmPassword: null,
      writtenDown: false,
      testnet: false,
      singleAddress: false,
    };
    this.appName = this.app.info.name;
    this.updateSeedSourceSelect(1);
  }

  ngOnInit() {
    this.createForm = this.fb.group({
      walletName: ['', Validators.required],
      bwsURL: [''],
      selectedSeed: [''],
      addPassword: [''],
      password: [''],
      confirmPassword: [''],
      writtenDown: ['false'],
      testnet: [''],
      singleAddress: [''],
    });

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
        if (this.formData.writtenDown) return false;
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
      label: 'Specify Recovery Phrase...',
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
    this.resetPasswordFields();
  }

  resetPasswordFields() {
    this.formData.password = null;
    this.formData.confirmPassword = null;
    this.formData.writtenDown = false;
  }

  create() {
    console.log(this.formData);
  }
}
