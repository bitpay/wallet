import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';

// Pages
import { HomePage } from '../../../pages/home/home';
import { CopayersPage } from '../copayers/copayers';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-join-wallet',
  templateUrl: 'join-wallet.html'
})
export class JoinWalletPage implements OnInit {

  private defaults: any;
  public showAdvOpts: boolean;
  public seedOptions: any;

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private joinForm: FormGroup;

  constructor(
    private configProvider: ConfigProvider,
    private form: FormBuilder,
    private navCtrl: NavController,
    private navParams: NavParams,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger
  ) {
    this.defaults = this.configProvider.getDefaults();

    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;

    this.showAdvOpts = false;

    this.joinForm = this.form.group({
      myName: [null, Validators.required],
      invitationCode: [null, Validators.required], // invitationCode == secret
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      addPassword: [false],
      password: [null],
      confirmPassword: [null],
      recoveryPhraseBackedUp: [null],
      derivationPath: [this.derivationPathByDefault],
      coin: [this.navParams.data.coin]
    });

    this.seedOptions = [{
      id: 'new',
      label: 'Random',
      supportsTestnet: true
    }, {
      id: 'set',
      label: 'Specify Recovery Phrase',
      supportsTestnet: false
    }];

    if (this.navParams.data.url) {
      let data = this.navParams.data.url;
      data = data.replace('copay:', '');
      this.onQrCodeScannedJoin(data);
    }
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad JoinWalletPage');
    this.resetFormFields();
  }

  ngOnInit() {
    this.joinForm.get('addPassword').valueChanges.subscribe((addPassword: boolean) => {
      if (addPassword) {
        this.joinForm.get('password').setValidators([Validators.required]);
        this.joinForm.get('confirmPassword').setValidators([Validators.required]);
      } else {
        this.joinForm.get('password').clearValidators();
        this.joinForm.get('confirmPassword').clearValidators();
      }
      this.joinForm.get('password').updateValueAndValidity();
      this.joinForm.get('confirmPassword').updateValueAndValidity();
    })
  }

  public validatePasswords(): boolean {
    if (this.joinForm.value.addPassword) {
      if (this.joinForm.value.password == this.joinForm.value.confirmPassword) {
        if (this.joinForm.value.recoveryPhraseBackedUp) return false;
      }
      return true;
    }
    return false;
  }

  public onQrCodeScannedJoin(data: string): void { // TODO
    this.joinForm.value.invitationCode = data;
  }

  public seedOptionsChange(seed: any): void {
    if (seed === 'set') {
      this.joinForm.get('recoveryPhrase').setValidators([Validators.required]);
    } else {
      this.joinForm.get('recoveryPhrase').setValidators(null);
    }
    this.joinForm.value.selectedSeed = seed;
    this.joinForm.value.testnet = false;
    this.joinForm.value.derivationPath = this.derivationPathByDefault;
    this.resetFormFields();
  }

  public resetFormFields(): void {
    this.joinForm.value.password = null;
    this.joinForm.value.confirmPassword = null;
    this.joinForm.value.recoveryPhraseBackedUp = null;
    this.joinForm.value.recoveryPhrase = null;
  }

  setDerivationPath() {
    this.joinForm.value.derivationPath = this.joinForm.value.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
  }

  public setOptsAndJoin(): void {

    let opts: any = {
      secret: this.joinForm.value.invitationCode,
      myName: this.joinForm.value.myName,
      bwsurl: this.joinForm.value.bwsurl,
      coin: this.joinForm.value.coin
    }

    let setSeed = this.joinForm.value.selectedSeed == 'set';
    if (setSeed) {
      let words = this.joinForm.value.recoveryPhrase;
      if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }
      opts.passphrase = this.joinForm.value.password;

      let pathData = this.derivationPathHelperProvider.parse(this.joinForm.value.derivationPath);
      if (!pathData) {
        this.popupProvider.ionicAlert('Error', 'Invalid derivation path'); // TODO: GetTextCatalog
        return;
      }

      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;
    } else {
      opts.passphrase = this.joinForm.value.password;
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      this.popupProvider.ionicAlert('Error', 'Please enter the wallet recovery phrase', 'Ok'); // TODO: GetTextCatalog
      return;
    }

    this.join(opts);
  }

  private join(opts: any): void {
    this.onGoingProcessProvider.set('joiningWallet', true);

    this.profileProvider.joinWallet(opts).then((wallet: any) => {
      this.onGoingProcessProvider.set('joiningWallet', false);
      this.walletProvider.updateRemotePreferences(wallet);

      if (!wallet.isComplete()) {
        this.navCtrl.setRoot(HomePage);
        this.navCtrl.popToRoot();
        this.navCtrl.push(CopayersPage, { walletId: wallet.credentials.walletId });
      } else {
        this.navCtrl.setRoot(HomePage);
        this.navCtrl.popToRoot();
      }
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('joiningWallet', false);
      this.popupProvider.ionicAlert('Error', err, 'Ok'); // TODO: GetTextCatalog
      return;
    });
  }

}
