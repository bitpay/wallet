import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { AppProvider } from '../../../providers/app/app';
import * as _ from 'lodash';

@Component({
  selector: 'page-join-wallet',
  templateUrl: 'join-wallet.html'
})
export class JoinWalletPage implements OnInit{
  public formData: any;
  public showAdvOpts: boolean;
  public seedOptions: any;

  private appName: string;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private joinForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    private app: AppProvider,
    private fb: FormBuilder
  ) {
    this.derivationPathByDefault = "m/44'/0'/0'";
    this.derivationPathForTestnet = "m/44'/1'/0'";
    this.showAdvOpts = false;
    this.formData = {
      copayerName: null,
      invitationCode: null,
      bwsURL: 'https://bws.bitpay.com/bws/api',
      recoveryPhrase: null,
      addPassword: false,
      password: null,
      confirmPassword: null,
      passwordSaved: null,
      derivationPath: this.derivationPathByDefault,
    };
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
  }

  ngOnInit() {
    this.joinForm = this.fb.group({
      copayerName: ['', Validators.required],
      invitationCode: ['', Validators.required],
      bwsURL: [''],
      selectedSeed: [''],
      recoveryPhrase: [''],
      addPassword: [''],
      password: [''],
      confirmPassword: [''],
      passwordSaved: [''],
      derivationPath: [''],
    });

    this.joinForm.get('addPassword').valueChanges.subscribe((addPassword: boolean) => {
      if (addPassword) {
        this.joinForm.get('password').setValidators([Validators.required]);
        this.joinForm.get('confirmPassword').setValidators([Validators.required]);
      }else {
        this.joinForm.get('password').clearValidators();
        this.joinForm.get('confirmPassword').clearValidators();
      }
      this.joinForm.get('password').updateValueAndValidity();
      this.joinForm.get('confirmPassword').updateValueAndValidity();
    })
  }

  validatePasswords() {
    if (this.formData.addPassword) {
      if (this.formData.password == this.formData.confirmPassword) {
        if (this.formData.passwordSaved) return false;
      }
      return true;
    }
    return false;
  }

  seedOptionsChange(seed: any) {
    this.formData.selectedSeed.id = seed;
    this.formData.testnet = false;
    this.formData.derivationPath = this.derivationPathByDefault;
    this.resetFormFields();
  }

  resetFormFields() {
    this.formData.password = null;
    this.formData.confirmPassword = null;
    this.formData.passwordSaved = null;
    this.formData.recoveryPhrase = null;
  }

  setDerivationPath() {
    this.formData.derivationPath = this.formData.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  join() {
    console.log(this.formData);
  }
}
