import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { AppProvider } from '../../../providers/app/app';
import * as _ from 'lodash';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage implements OnInit{
  public formData: any;
  public showAdvOpts: boolean;
  public selectedTab: string;
  public seedOptions: any;

  private appName: string;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private importForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    private app: AppProvider,
    private fb: FormBuilder
  ) {
    this.selectedTab = 'words';
    this.derivationPathByDefault = "m/44'/0'/0'";
    this.derivationPathForTestnet = "m/44'/1'/0'";
    this.showAdvOpts = false;
    this.formData = {
      words: null,
      text: null,
      filePassword: null,
      selectedSeed: null,
      isShared: null,
      account: 1,
      mnemonicPassword: null,
      derivationPath: this.derivationPathByDefault,
      fromHW: false,
      testnet: false,
      bwsURL: 'https://bws.bitpay.com/bws/api',
    };
    this.appName = this.app.info.name;
    this.updateSeedSourceSelect();
  }

  ngOnInit() {
    this.importForm = this.fb.group({
      words: ['', Validators.required],
      file: [''],
      filePassword: [''],
      selectedSeed: [''],
      isShared: [''],
      account: [''],
      mnemonicPassword: [''],
      derivationPath: [''],
      fromHW: [''],
      testnet: [''],
      bwsURL: [''],
    });
  }

  updateSeedSourceSelect() {
    if (this.appName === 'bitpay') return;

    this.seedOptions = [{
      id: 'trezor',
      label: 'Trezor hardware wallet',
      supportsTestnet: false
    }, {
      id: 'ledger',
      label: 'Ledger hardware wallet',
      supportsTestnet: false
    }];
    this.formData.selectedSeed = {
      id: this.seedOptions[0].id
    };
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
        case 'file':
        this.importForm.get('file').setValidators([Validators.required]);
        this.importForm.get('filePassword').setValidators([Validators.required]);
        this.importForm.get('words').clearValidators();
        break;
        
        default:
        this.importForm.get('words').clearValidators();
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
      }
      this.importForm.get('words').updateValueAndValidity();
      this.importForm.get('file').updateValueAndValidity();
      this.importForm.get('filePassword').updateValueAndValidity();
  }

  seedOptionsChange(id: string) {
    if (id === 'trezor') this.formData.isShared = null;
  }

  setDerivationPath() {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  import() {
    console.log(this.formData);
  }
}
