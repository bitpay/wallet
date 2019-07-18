import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { App, Events, NavController, NavParams } from 'ionic-angular';

// Pages
import { ScanPage } from '../../scan/scan';
import { TabsPage } from '../../tabs/tabs';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  Coin,
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-join-wallet',
  templateUrl: 'join-wallet.html'
})
export class JoinWalletPage {
  private defaults;
  public showAdvOpts: boolean;
  public seedOptions;
  public okText: string;
  public cancelText: string;
  public joinForm: FormGroup;
  public keyId: string;

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private regex: RegExp;
  private coin: Coin;

  constructor(
    private app: App,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private form: FormBuilder,
    private navCtrl: NavController,
    private navParams: NavParams,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private clipboardProvider: ClipboardProvider
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.defaults = this.configProvider.getDefaults();
    this.showAdvOpts = false;
    this.keyId = this.navParams.get('keyId');

    this.regex = /^[0-9A-HJ-NP-Za-km-z]{70,80}$/; // For invitationCode
    this.joinForm = this.form.group({
      walletName: [null, Validators.required],
      myName: [null, Validators.required],
      invitationCode: [
        null,
        [Validators.required, Validators.pattern(this.regex)]
      ], // invitationCode == secret
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [null]
    });

    this.seedOptions = [
      {
        id: 'new',
        label: this.translate.instant('Random'),
        supportsTestnet: true
      },
      {
        id: 'set',
        label: this.translate.instant('Specify Recovery Phrase'),
        supportsTestnet: false
      }
    ];
    this.events.subscribe(
      'Local/InvitationScan',
      this.updateInvitationCodeHandler
    );
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: JoinWalletPage');
  }

  ionViewWillEnter() {
    if (this.navParams.data.url) {
      let data: string = this.navParams.data.url;
      data = data.replace('copay:', '');
      this.onQrCodeScannedJoin(data);
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe(
      'Local/InvitationScan',
      this.updateInvitationCodeHandler
    );
  }

  private updateInvitationCodeHandler: any = data => {
    const invitationCode = data.value.replace('copay:', '');
    this.onQrCodeScannedJoin(invitationCode);
  };

  public onQrCodeScannedJoin(data: string): void {
    if (this.regex.test(data)) {
      this.joinForm.controls['invitationCode'].setValue(data);
      this.processInvitation(data);
    } else {
      const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
        'default-error',
        {
          msg: this.translate.instant('Invalid data'),
          title: this.translate.instant('Error')
        }
      );
      errorInfoSheet.present();
    }
  }

  public seedOptionsChange(seed): void {
    if (seed === 'set') {
      this.joinForm.get('recoveryPhrase').setValidators([Validators.required]);
    } else {
      this.joinForm.get('recoveryPhrase').setValidators(null);
    }
    this.joinForm.controls['recoveryPhrase'].setValue(null);
    this.joinForm.controls['selectedSeed'].setValue(seed);
    this.processInvitation(this.joinForm.value.invitationCode);
  }

  private setDerivationPath(network: string): void {
    const path: string =
      network == 'testnet'
        ? this.derivationPathForTestnet
        : this.derivationPathByDefault;
    this.joinForm.controls['derivationPath'].setValue(path);
  }

  public processInvitation(invitation: string): void {
    if (this.regex.test(invitation)) {
      this.logger.info('Processing invitation code...');
      let walletData;
      try {
        walletData = this.bwcProvider.parseSecret(invitation);
        this.coin = walletData.coin;
        this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
        this.derivationPathByDefault =
          this.coin == 'bch'
            ? this.derivationPathHelperProvider.defaultBCH
            : this.derivationPathHelperProvider.defaultBTC;

        this.setDerivationPath(walletData.network);

        this.logger.info('Correct invitation code for ' + walletData.network);
      } catch (ex) {
        this.logger.warn('Error parsing invitation: ' + ex);
      }
    }
  }

  public setOptsAndJoin(): void {
    const opts: Partial<WalletOptions> = {
      keyId: this.keyId,
      name: this.joinForm.value.walletName,
      secret: this.joinForm.value.invitationCode,
      myName: this.joinForm.value.myName,
      bwsurl: this.joinForm.value.bwsURL,
      coin: this.coin
    };

    const setSeed = this.joinForm.value.selectedSeed == 'set';
    if (setSeed) {
      const words = this.joinForm.value.recoveryPhrase;
      if (
        words.indexOf(' ') == -1 &&
        words.indexOf('prv') == 1 &&
        words.length > 108
      ) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }

      const derivationPath = this.joinForm.value.derivationPath;
      opts.networkName = this.derivationPathHelperProvider.getNetworkName(
        derivationPath
      );
      opts.derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
        derivationPath
      );
      opts.account = this.derivationPathHelperProvider.getAccount(
        derivationPath
      );

      if (
        !opts.networkName ||
        !opts.derivationStrategy ||
        !Number.isInteger(opts.account)
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant('Invalid derivation path');
        this.popupProvider.ionicAlert(title, subtitle);
        return;
      }

      if (
        !this.derivationPathHelperProvider.isValidDerivationPathCoin(
          this.joinForm.value.derivationPath,
          this.coin
        )
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'Invalid derivation path for selected coin'
        );
        this.popupProvider.ionicAlert(title, subtitle);
        return;
      }
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the wallet recovery phrase'
      );
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    this.join(opts);
  }

  private join(opts): void {
    this.onGoingProcessProvider.set('joiningWallet');
    const addingNewWallet = this.keyId ? true : false;
    this.profileProvider
      .joinWallet(addingNewWallet, opts)
      .then(wallet => {
        this.clipboardProvider.clearClipboardIfValidData(['JoinWallet']);
        this.onGoingProcessProvider.clear();
        this.walletProvider.updateRemotePreferences(wallet);
        this.pushNotificationsProvider.updateSubscription(wallet);
        if (!addingNewWallet) {
          this.profileProvider.setWalletGroupName(
            wallet.credentials.keyId,
            wallet.credentials.walletName
          );
        }
        // using setRoot(TabsPage) as workaround when coming from scanner
        this.app
          .getRootNavs()[0]
          .setRoot(TabsPage)
          .then(() => {
            this.events.publish('Local/WalletListChange');

            setTimeout(() => {
              this.events.publish('OpenWallet', wallet);
            }, 1000);
          });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Error');
        this.popupProvider.ionicAlert(title, err);
        return;
      });
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromJoin: true });
  }
}
