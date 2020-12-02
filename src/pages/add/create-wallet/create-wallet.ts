import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';

// Pages
import { CopayersPage } from '../../add/copayers/copayers';
import { CreateEthMultisigPage } from '../../add/create-eth-multisig/create-eth-multisig';
import { KeyOnboardingPage } from '../../settings/key-settings/key-onboarding/key-onboarding';
import { WalletDetailsPage } from '../../wallet-details/wallet-details';
@Component({
  selector: 'page-create-wallet',
  templateUrl: 'create-wallet.html'
})
export class CreateWalletPage implements OnInit {
  /* For compressed keys, m*73 + n*34 <= 496 */
  private COPAYER_PAIR_LIMITS = {
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
    12: 1
  };

  private defaults;
  private tc: number;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private showKeyOnboarding: boolean;

  public keyId: string;
  public copayers: number[];
  public signatures: number[];
  public showAdvOpts: boolean;
  public seedOptions;
  public isShared: boolean;
  public coin: Coin;
  public coinName: string;
  public okText: string;
  public cancelText: string;
  public createForm: FormGroup;

  public multisigAddresses: string[];
  public invalidAddress: boolean;
  public pairedWallet: any;
  public isOpenSelector: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private currencyProvider: CurrencyProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private fb: FormBuilder,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private modalCtrl: ModalController,
    private persistenceProvider: PersistenceProvider,
    private errorsProvider: ErrorsProvider
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.isShared = this.navParams.get('isShared');
    this.coin = this.navParams.get('coin');
    this.coinName = this.currencyProvider.getCoinName(this.coin);
    this.keyId = this.navParams.get('keyId');
    this.defaults = this.configProvider.getDefaults();
    this.multisigAddresses = [];
    this.tc = this.isShared ? this.defaults.wallet.totalCopayers : 1;
    this.copayers = _.range(2, this.defaults.limits.totalCopayers + 1);
    this.derivationPathByDefault = this.isShared
      ? this.coin === 'bch'
        ? this.derivationPathHelperProvider.defaultMultisigBCH
        : this.derivationPathHelperProvider.defaultMultisigBTC
      : this.bwcProvider.getCore().Deriver.pathFor(this.coin, 'livenet');
    this.derivationPathForTestnet = this.bwcProvider
      .getCore()
      .Deriver.pathFor(this.coin, 'testnet');
    this.showAdvOpts = false;
    const walletName =
      this.currencyProvider.getCoinName(this.coin) +
      (this.isShared ? ' Multisig' : '');
    this.createForm = this.fb.group({
      walletName: [walletName, Validators.required],
      myName: [null],
      totalCopayers: [1],
      requiredCopayers: [1],
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [this.derivationPathByDefault],
      testnetEnabled: [false],
      useNativeSegwit: [false],
      singleAddress: [false],
      coin: [null, Validators.required]
    });
    this.createForm.controls['coin'].setValue(this.coin);
    if (this.coin === 'btc')
      this.createForm.controls['useNativeSegwit'].setValue(true);
    this.showKeyOnboarding = this.navParams.data.showKeyOnboarding;

    this.setTotalCopayers(this.tc);
    this.updateRCSelect(this.tc);
    this.updateSeedSourceSelect();
  }

  ngOnInit() {
    if (this.isShared) {
      if (this.coin.toLowerCase() == 'eth') {
        this.showPairedWalletSelector();
      } else {
        this.createForm.get('myName').setValidators([Validators.required]);
      }
    }
  }

  public setTotalCopayers(n: number): void {
    this.createForm.controls['totalCopayers'].setValue(n);
  }

  private updateRCSelect(n: number): void {
    const maxReq = this.COPAYER_PAIR_LIMITS[n];
    this.signatures = _.range(1, maxReq + 1);
    this.createForm.controls['requiredCopayers'].setValue(
      Math.min(Math.trunc(n / 2 + 1), maxReq)
    );
  }

  public isSingleAddress() {
    return this.currencyProvider.isSingleAddress(this.coin);
  }

  private updateSeedSourceSelect(): void {
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
    this.createForm.controls['selectedSeed'].setValue(this.seedOptions[0].id); // new or set
  }

  public seedOptionsChange(seed): void {
    if (seed === 'set') {
      this.createForm
        .get('recoveryPhrase')
        .setValidators([Validators.required]);
    } else {
      this.createForm.get('recoveryPhrase').setValidators(null);
    }
    this.createForm.controls['selectedSeed'].setValue(seed); // new or set
    if (this.createForm.controls['testnet'])
      this.createForm.controls['testnet'].setValue(false);
    if (this.createForm.controls['useNativeSegwit'])
      this.createForm.controls['useNativeSegwit'].setValue(false);
    this.createForm.controls['derivationPath'].setValue(
      this.derivationPathByDefault
    );
    this.createForm.controls['recoveryPhrase'].setValue(null);
  }

  public setDerivationPath(): void {
    const path: string = this.createForm.value.testnet
      ? this.derivationPathForTestnet
      : this.derivationPathByDefault;
    this.createForm.controls['derivationPath'].setValue(path);
  }

  public setOptsAndCreate(): void {
    const opts: Partial<WalletOptions> = {
      keyId: this.keyId,
      name: this.createForm.value.walletName,
      m: this.createForm.value.requiredCopayers,
      n: this.createForm.value.totalCopayers,
      myName:
        this.createForm.value.totalCopayers > 1
          ? this.createForm.value.myName
          : null,
      networkName: this.createForm.value.testnetEnabled ? 'testnet' : 'livenet',
      useNativeSegwit: this.createForm.value.useNativeSegwit,
      bwsurl: this.createForm.value.bwsURL,
      singleAddress: this.currencyProvider.isSingleAddress(
        this.createForm.value.coin
      )
        ? true
        : this.createForm.value.singleAddress,
      coin: this.createForm.value.coin
    };

    const setSeed = this.createForm.value.selectedSeed == 'set';
    if (setSeed) {
      const words = this.createForm.value.recoveryPhrase || '';
      if (
        words.indexOf(' ') == -1 &&
        words.indexOf('prv') == 1 &&
        words.length > 108
      ) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }

      const derivationPath = this.createForm.value.derivationPath;
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
        this.derivationPathHelperProvider.parsePath(
          this.createForm.value.derivationPath
        ).purpose == "44'" &&
        opts.n > 1
      ) {
        opts.useLegacyPurpose = true;
        this.logger.debug('Using 44 for Multisig');
      }

      // set opts.useLegacyCoinType
      if (
        this.coin == 'bch' &&
        this.derivationPathHelperProvider.parsePath(
          this.createForm.value.derivationPath
        ).coinCode == "0'"
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
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the wallet recovery phrase'
      );
      this.errorsProvider.showDefaultError(subtitle, title);
      return;
    }

    if (
      !this.derivationPathHelperProvider.isValidDerivationPathCoin(
        this.createForm.value.derivationPath,
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

    if (this.showKeyOnboarding) {
      this.showKeyOnboardingSlides(opts);
    } else {
      this.create(opts);
    }
  }

  private showKeyOnboardingSlides(opts) {
    this.logger.debug('Showing key onboarding');
    const modal = this.modalCtrl.create(KeyOnboardingPage, null, {
      showBackdrop: false,
      enableBackdropDismiss: false
    });
    modal.present();
    modal.onDidDismiss(() => {
      this.create(opts);
    });
    this.persistenceProvider.setKeyOnboardingFlag();
  }

  private create(opts): void {
    this.onGoingProcessProvider.set('creatingWallet');
    opts['keyId'] = this.keyId;
    this.profileProvider
      .createWallet(opts)
      .then(wallet => {
        this.onGoingProcessProvider.clear();
        this.walletProvider.updateRemotePreferences(wallet);
        this.pushNotificationsProvider.updateSubscription(wallet);
        if (this.createForm.value.selectedSeed == 'set') {
          this.profileProvider.setBackupGroupFlag(wallet.credentials.keyId);
          this.profileProvider.setWalletBackup(wallet.credentials.walletId);
        }
        this.navCtrl.popToRoot().then(() => {
          this.events.publish('Local/FetchWallets');
          setTimeout(() => {
            if (wallet.isComplete()) {
              this.navCtrl.push(WalletDetailsPage, {
                walletId: wallet.credentials.walletId
              });
            } else {
              const copayerModal = this.modalCtrl.create(
                CopayersPage,
                {
                  walletId: wallet.credentials.walletId
                },
                {
                  cssClass: 'wallet-details-modal'
                }
              );
              copayerModal.present();
            }
          }, 1000);
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          this.logger.error('Create: could not create wallet', err);
          if (err.message === 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            const title = this.translate.instant('Error');
            err = this.bwcErrorProvider.msg(err);
            this.errorsProvider.showDefaultError(err, title);
          }
        }
        return;
      });
  }

  public openSupportSingleAddress(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/360015920572-Setting-up-the-Single-Address-Feature-for-your-BitPay-Wallet';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('Read more in our support page');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public set(type: string, number: number) {
    switch (type) {
      case 'requiredCopayers':
        if (this.signatures.includes(number)) {
          this.createForm.controls['requiredCopayers'].setValue(number);
        }
        break;

      case 'totalCopayers':
        if (this.copayers.includes(number)) {
          this.createForm.controls['totalCopayers'].setValue(number);
        }
        break;
    }
  }

  public showPairedWalletSelector() {
    this.isOpenSelector = true;
    const eligibleWallets = this.keyId
      ? this.profileProvider.getWalletsFromGroup({
          keyId: this.keyId,
          hasFunds: true,
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
        this.createForm.controls['testnetEnabled'].setValue(
          this.pairedWallet.network == 'testnet' ? true : false
        );
      }
    });
  }

  public goToCreateEthMultisig() {
    this.navCtrl.push(CreateEthMultisigPage, {
      pairedWallet: this.pairedWallet,
      m: this.createForm.value.requiredCopayers,
      n: this.createForm.value.totalCopayers,
      testnetEnabled: this.createForm.value.testnetEnabled,
      walletName: this.createForm.value.walletName
    });
  }
}
