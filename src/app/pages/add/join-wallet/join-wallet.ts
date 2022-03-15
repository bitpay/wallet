import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';

// Pages
import { CopayersPage } from '../../add/copayers/copayers';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { ConfigProvider } from '../../../providers/config/config';
import { Coin } from '../../../providers/currency/currency';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import { ExternalLinkProvider } from 'src/app/providers';
@Component({
  selector: 'page-join-wallet',
  templateUrl: 'join-wallet.html',
  styleUrls: ['/join-wallet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class JoinWalletPage {
  private defaults;
  public isCordova: boolean;
  public showAdvOpts: boolean;
  public seedOptions;
  public okText: string;
  public cancelText: string;
  public joinForm: FormGroup;
  public keyId: string;
  public coin: Coin;
  public isOpenSelector: boolean;
  public pairedWallet;

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private regex: RegExp;
  navParamsData;
  constructor(
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private form: FormBuilder,
    private navCtrl: NavController,
    private navParams: NavParams,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: EventManagerService,
    private pushNotificationsProvider: PushNotificationsProvider,
    private clipboardProvider: ClipboardProvider,
    private modalCtrl: ModalController,
    private errorsProvider: ErrorsProvider,
    private actionSheetProvider: ActionSheetProvider,
    private router: Router,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (_.isEmpty(this.navParamsData) && this.navParams && !_.isEmpty(this.navParams.data)) this.navParamsData = this.navParams.data;

    this.isCordova = this.platformProvider.isCordova;
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.defaults = this.configProvider.getDefaults();
    this.showAdvOpts = false;
    this.keyId = this.navParamsData.keyId;
    this.coin = this.navParamsData.coin;
    this.regex = /^[0-9A-HJ-NP-Za-km-z]{70,80}$/; // For invitationCode
    this.joinForm = this.form.group({
      walletName: [null],
      myName: [null],
      invitationCode: [null], // invitationCode == secret
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [null]
    });


    this.joinForm.get('myName').setValidators([Validators.required]);
    this.joinForm
      .get('invitationCode')
      .setValidators([Validators.required, Validators.pattern(this.regex)]);

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
    this.events.subscribe('Local/JoinScan', this.updateCodeHandler);
  }

  ngOnInit() {
    this.logger.info('Loaded: JoinWalletPage');
  }

  ionViewWillEnter() {
    if (this.navParamsData.url) {
      let data: string = this.navParamsData.url;
      data = data.replace('copay:', '');
      this.onQrCodeScannedJoin(data);
    }
    if (this.coin.toLowerCase() == 'eth' && !this.pairedWallet) {
      this.showPairedWalletSelector();
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/JoinScan', this.updateCodeHandler);
  }

  public showPairedWalletSelector() {
    this.isOpenSelector = true;
    const eligibleWallets = this.keyId
      ? this.profileProvider.getWalletsFromGroup({
        keyId: this.keyId,
        coin: 'eth',
        m: 1,
        n: 1
      })
      : [];

    const walletSelector = this.actionSheetProvider.createInfoSheet(
      'linkEthWallet',
      {
        wallets: eligibleWallets,
        isEthMultisig: true
      }
    );
    walletSelector.present();
    walletSelector.onDidDismiss(pairedWallet => {
      this.isOpenSelector = false;
      if (!_.isEmpty(pairedWallet)) {
        this.pairedWallet = pairedWallet;
      }
    });
  }

  private updateCodeHandler: any = data => {
    if (this.coin.toLowerCase() == 'eth') {
      this.joinForm.controls['invitationCode'].setValue(data.value);
    } else {
      const invitationCode = data.value.replace('copay:', '');
      this.onQrCodeScannedJoin(invitationCode);
    }
  };

  public onQrCodeScannedJoin(data: string): void {
    if (this.regex.test(data)) {
      this.joinForm.controls['invitationCode'].setValue(data);
      this.processInvitation(data);
    } else {
      this.errorsProvider.showDefaultError(
        this.translate.instant('Invalid data'),
        this.translate.instant('Error')
      );
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


  public async setOptsAndJoin() {

    const opts: Partial<WalletOptions> = {
      keyId: this.keyId,
      secret: this.joinForm.value.invitationCode,
      myName: this.joinForm.value.myName,
      bwsurl: this.joinForm.value.bwsURL,
      coin: this.coin
    };

    const setSeed = this.joinForm.value.selectedSeed == 'set';
    opts['setSeed'] = setSeed;
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

      // set opts.useLegacyPurpose
      if (
        this.derivationPathHelperProvider.parsePath(derivationPath).purpose ==
        "44'"
      ) {
        opts.useLegacyPurpose = true;
        this.logger.debug('Using 44 for Multisig');
      }

      // set opts.useLegacyCoinType
      if (
        this.coin == 'bch' &&
        this.derivationPathHelperProvider.parsePath(derivationPath).coinCode ==
        "0'"
      ) {
        opts.useLegacyCoinType = true;
        this.logger.debug('Using 0 for BCH creation');
      }

      if (
        !opts.networkName ||
        !opts.derivationStrategy ||
        !Number.isInteger(opts.account)
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant('Invalid derivation path');
        this.errorsProvider.showDefaultError(subtitle, title);
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
        this.errorsProvider.showDefaultError(subtitle, title);
        return;
      }
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the wallet recovery phrase'
      );
      this.errorsProvider.showDefaultError(subtitle, title);
      return;
    }

    const joinWarningSheet = this.actionSheetProvider.createInfoSheet(
      'join-wallet-warning'
    );
    joinWarningSheet.present();
    joinWarningSheet.onDidDismiss(option => {
      if (option) {
        // TODO: update support page of AbcPay
        this.externalLinkProvider.open(
          'https://support.bitpay.com/hc/en-us/articles/360032618692-What-is-a-Multisignature-Multisig-or-Shared-Wallet-'
        );
      } else {
        this.join(opts);
      }
    });
  }

  private join(opts): void {
    this.onGoingProcessProvider.set('joiningWallet');
    opts['keyId'] = this.keyId;
    this.profileProvider
      .joinWallet(opts)
      .then(wallet => {
        this.clipboardProvider.clearClipboardIfValidData(['JoinWallet']);
        this.onGoingProcessProvider.clear();
        this.walletProvider.updateRemotePreferences(wallet);
        this.pushNotificationsProvider.updateSubscription(wallet);
        if (!opts['setSeed'] && !this.keyId) {
          this.router.navigate(['/recovery-key'], {
            state: {
              keyId: wallet.keyId,
              isOnboardingFlow: false,
              hideBackButton: true
            }
          });
        }
        else {
          this.router.navigate(['']).then(() => {
            setTimeout(() => {
              if (wallet.isComplete()) {
                this.router.navigate(['/wallet-details'], {
                  state: { walletId: wallet.credentials.walletId }
                });
              } else {
                const copayerModal = this.modalCtrl.create({
                  component: CopayersPage,
                  componentProps: {
                    walletId: wallet.credentials.walletId
                  },
                  cssClass: 'wallet-details-modal'
                }).then(rs => {
                  rs.present();
                });
              }
            }, 1000);
          });
        }
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Error');
        this.errorsProvider.showDefaultError(
          this.bwcErrorProvider.msg(err),
          title
        );
        return;
      });
  }

  public openScanner(): void {
    this.router.navigate(['/scan'], { state: { fromJoin: true } });
  }
}
