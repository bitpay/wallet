import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { CopayersPage } from '../../add/copayers/copayers';
import { ScanPage } from '../../scan/scan';
import { WalletDetailsPage } from '../../wallet-details/wallet-details';

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
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
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
  public coin: Coin;
  public isOpenSelector: boolean;
  public pairedWallet;

  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;
  private regex: RegExp;

  constructor(
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private form: FormBuilder,
    private navCtrl: NavController,
    private navParams: NavParams,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider,
    private clipboardProvider: ClipboardProvider,
    private modalCtrl: ModalController,
    private errorsProvider: ErrorsProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.defaults = this.configProvider.getDefaults();
    this.showAdvOpts = false;
    this.keyId = this.navParams.data.keyId;
    this.coin = this.navParams.data.coin;
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

    if (this.coin === 'eth') {
      this.joinForm.get('walletName').setValidators([Validators.required]);
      this.joinForm.controls['walletName'].setValue(
        this.translate.instant('ETH Multisig')
      );
      this.joinForm.get('invitationCode').setValidators([Validators.required]);
    } else {
      this.joinForm.get('myName').setValidators([Validators.required]);
      this.joinForm
        .get('invitationCode')
        .setValidators([Validators.required, Validators.pattern(this.regex)]);
    }

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

  ionViewDidLoad() {
    this.logger.info('Loaded: JoinWalletPage');
  }

  ionViewWillEnter() {
    if (this.navParams.data.url) {
      let data: string = this.navParams.data.url;
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

  private createAndBindMultisigWallet(pairedWallet, multisigEthInfo) {
    this.profileProvider
      .createMultisigEthWallet(pairedWallet, multisigEthInfo)
      .then(multisigWallet => {
        // store preferences for the paired eth wallet
        this.walletProvider.updateRemotePreferences(pairedWallet);
        this.navCtrl.popToRoot({ animate: false }).then(() => {
          if (multisigWallet) {
            setTimeout(() => {
              this.navCtrl.push(WalletDetailsPage, {
                walletId: multisigWallet.credentials.walletId
              });
            }, 1000);
          }
        });
      });
  }

  public async setOptsAndJoin() {
    if (this.coin === 'eth') {
      const multisigContractAddress = this.joinForm.value.invitationCode;
      const walletName = this.joinForm.value.walletName;
      const ownerAddress = await this.walletProvider.getAddress(
        this.pairedWallet,
        false
      );
      let contractInfo;
      try {
        contractInfo = await this.walletProvider.getMultisigContractInfo(
          this.pairedWallet,
          {
            multisigContractAddress
          }
        );
      } catch (error) {
        this.logger.error('Multisig contract address not found', error.message);
      }
      if (!contractInfo) {
        // show error multisig contract not found
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'Multisig contract address not found.'
        );
        this.errorsProvider.showDefaultError(subtitle, title);
      } else if (!_.includes(contractInfo.owners, ownerAddress)) {
        // show error multisig contract wrong owner
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'The ethereum paired wallet you choose does not belong to this contract'
        );
        this.errorsProvider.showDefaultError(subtitle, title);
      } else {
        const m = contractInfo.owners.length;
        const n = Number(contractInfo.required);
        this.createAndBindMultisigWallet(this.pairedWallet, {
          multisigContractAddress,
          walletName,
          n,
          m
        });
      }
      return;
    }

    const opts: Partial<WalletOptions> = {
      keyId: this.keyId,
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

    this.join(opts);
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

        this.navCtrl.popToRoot({ animate: false }).then(() => {
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
        const title = this.translate.instant('Error');
        this.errorsProvider.showDefaultError(
          this.bwcErrorProvider.msg(err),
          title
        );
        return;
      });
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromJoin: true });
  }
}
