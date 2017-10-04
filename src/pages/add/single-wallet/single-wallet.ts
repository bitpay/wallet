import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AppProvider } from '../../../providers/app/app';

@Component({
  selector: 'page-single-wallet',
  templateUrl: 'single-wallet.html'
})
export class SingleWalletPage {
  public formData: any;
  public showAdvOpts: boolean;
  public seedOptions: any;

  private appName: string;

  constructor(public navCtrl: NavController, private app: AppProvider) {
    this.showAdvOpts = false;
    this.formData = {
      bwsURL: 'https://bws.bitpay.com/bws/api',
      addPassword: false,
      passphrase: null,
      repeatPassphrase: null,
      testnet: false,
      singleAddress: false,
    };
    this.seedOptions = [{
      id: 'new',
      label: 'Random',
      supportsTestnet: true
    }, {
      id: 'set',
      label: 'Specify Recovery Phrase...',
      supportsTestnet: false
    }];
    this.appName = this.app.info.name;
    this.updateSeedSourceSelect(1);
  }

  updateSeedSourceSelect(n: number) {
    this.formData.selectedSeed = {
      id: this.seedOptions[0].id
    };

    /* Disable Hardware Wallets for BitPay distribution */
    var seedOptions = [];

    if (this.appName == 'copay') {
      // if (n > 1 && walletService.externalSource.ledger.supported)
      //   seedOptions.push({
      //     id: walletService.externalSource.ledger.id,
      //     label: walletService.externalSource.ledger.longName,
      //     supportsTestnet: walletService.externalSource.ledger.supportsTestnet
      //   });

      // if (walletService.externalSource.trezor.supported) {
      //   seedOptions.push({
      //     id: walletService.externalSource.trezor.id,
      //     label: walletService.externalSource.trezor.longName,
      //     supportsTestnet: walletService.externalSource.trezor.supportsTestnet
      //   });
      // }

      // if (walletService.externalSource.intelTEE.supported) {
      //   seedOptions.push({
      //     id: walletService.externalSource.intelTEE.id,
      //     label: walletService.externalSource.intelTEE.longName,
      //     supportsTestnet: walletService.externalSource.intelTEE.supportsTestnet
      //   });
      // }
    }
    this.seedOptions = this.seedOptions.concat(seedOptions);
    console.log('Seed options:', this.seedOptions);
  };

  seedOptionsChange(seed: any) {
    this.formData.selectedSeed.id = seed;
    this.resetPasswordFields();
  }

  resetPasswordFields() {
    this.formData.passphrase = 
    this.formData.createPassphrase = 
    this.formData.passwordSaved = 
    this.formData.repeatPassword = 
    // this.result = 
    null;
  }
}
