import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { BwcProvider } from '../../../providers/bwc/bwc';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { DerivationPathHelperProvider } from '../../../providers/derivationPathHelper/derivationPathHelper';
import { ConfigProvider } from '../../../providers/config/config';

@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html'
})
export class ImportWalletPage implements OnInit{
  public formData: any;
  public showAdvOpts: boolean;
  public selectedTab: string;
  public seedOptions: any;

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private importForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    private form: FormBuilder,
    private bwc: BwcProvider,
    private pathHelper: DerivationPathHelperProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
  ) {
    this.selectedTab = 'words';
    this.derivationPathByDefault = this.pathHelper.default;
    this.derivationPathForTestnet = this.pathHelper.defaultTestnet;
    this.showAdvOpts = false;
    this.formData = {
      words: null,
      mnemonicPassword: null,
      file: null,
      filePassword: null,
      derivationPath: this.derivationPathByDefault,
      testnet: false,
      bwsURL: this.configProvider.get()['bws']['url'],
    };
  }

  ngOnInit() {
    this.importForm = this.form.group({
      words: ['', Validators.required],
      mnemonicPassword: [''],
      file: [''],
      filePassword: [''],
      derivationPath: [''],
      testnet: [''],
      bwsURL: [''],
    });
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

  setDerivationPath() {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }
  
  normalizeMnemonic(words: string) {
    if (!words || !words.indexOf) return words;
    var isJA = words.indexOf('\u3000') > -1;
    var wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  };

  import() {
    console.log(this.formData);
  }
}
