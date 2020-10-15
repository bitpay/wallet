import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../../providers/logger/logger';

// Providers
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../../../../providers/config/config';
import { Coin } from '../../../../../providers/currency/currency';
import { DerivationPathHelperProvider } from '../../../../../providers/derivation-path-helper/derivation-path-helper';
import { ErrorsProvider } from '../../../../../providers/errors/errors';
import { ExternalLinkProvider } from '../../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-duplicate',
  templateUrl: 'wallet-duplicate.html'
})
export class WalletDuplicatePage {
  defaults: any;

  public availableWallet;
  public nonEligibleWallet;
  public error;
  public wallet;

  constructor(
    private walletProvider: WalletProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    public navCtrl: NavController,
    public profileProvider: ProfileProvider,
    public derivationPathHelperProvider: DerivationPathHelperProvider,
    private errorsProvider: ErrorsProvider
  ) {
    this.defaults = this.configProvider.getDefaults();
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    const derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
      this.wallet.credentials.rootPath
    );

    // Filter out already duplicated wallets
    let walletsBCH = this.profileProvider.getWallets({
      coin: 'bch',
      network: 'livenet'
    });
    let xPubKeyIndex = _.keyBy(walletsBCH, 'credentials.xPubKey');

    if (xPubKeyIndex[this.wallet.credentials.xPubKey]) {
      this.nonEligibleWallet = this.wallet;
      this.nonEligibleWallet.excludeReason = this.translate.instant(
        'Already duplicated'
      );
    } else if (derivationStrategy != 'BIP44') {
      this.nonEligibleWallet = this.wallet;
      this.nonEligibleWallet.excludeReason = this.translate.instant(
        'Non BIP44 wallet'
      );
    } else if (!this.wallet.canSign) {
      this.nonEligibleWallet = this.wallet;
      this.nonEligibleWallet.excludeReason = this.translate.instant(
        'Read only wallet'
      );
    } else if (this.wallet.needsBackup) {
      this.nonEligibleWallet = this.wallet;
      this.nonEligibleWallet.excludeReason = this.translate.instant(
        'Wallet Needs Backup'
      );
      this.nonEligibleWallet.body = this.translate.instant(
        `Before duplicating your wallet, it's recommended that you first write down your recovery phrase and store it securely so that your wallet can be recovered in the case your device was lost or stolen.`
      );
    } else {
      this.availableWallet = this.wallet;
    }

    if (!this.availableWallet) return;
  }

  private setErr(err) {
    const errorMsg = this.bwcErrorProvider.msg(err, 'Could not duplicate');
    this.logger.warn('Duplicate BCH', errorMsg);
    this.errorsProvider.showDefaultError(
      errorMsg,
      this.translate.instant('Error')
    );
    return;
  }

  public duplicate(wallet) {
    this.logger.info(
      `Duplicating wallet for BCH: ${wallet.id} - ${wallet.name}`
    );

    let opts: any = {
      useLegacyCoinType: true,
      useLegacyPurpose: true,
      name: `${wallet.name} [BCH duplicate]`,
      m: wallet.m,
      n: wallet.n,
      myName: wallet.credentials.copayerName,
      networkName: wallet.network,
      coin: Coin.BCH,
      walletPrivKey: wallet.credentials.walletPrivKey,
      compliantDerivation: wallet.credentials.compliantDerivation,
      bwsurl: this.defaults.bws.url,
      derivationStrategy: wallet.credentials.derivationStrategy,
      addressType: wallet.credentials.addressType
    };

    this.walletProvider
      .getKeys(wallet)
      .then(key => {
        opts.extendedPrivateKey = key.xPrivKey;
        opts.duplicateKeyId = wallet.credentials.keyId;
        this.logger.debug(
          'Duplicating Wallet. using key :',
          opts.duplicateKeyId
        );
        this.onGoingProcessProvider.set('duplicatingWallet');
        this.importOrCreate(wallet, opts)
          .then(result => {
            let newWallet = result.walletBch;
            let isNew = result.isNew;

            this.walletProvider.updateRemotePreferences(newWallet);
            this.pushNotificationsProvider.updateSubscription(newWallet);

            // Multisig wallets? add Copayers
            this.addCopayers(wallet, newWallet, isNew)
              .then(() => {
                this.onGoingProcessProvider.clear();

                if (isNew) {
                  this.walletProvider.startScan(newWallet).catch(err => {
                    this.logger.warn(err);
                  });
                }
                this.events.publish('status:updated');
                this.navCtrl.popToRoot();
              })
              .catch(err => {
                this.onGoingProcessProvider.clear();
                this.setErr(err);
              });
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            this.setErr(err);
          });
      })
      .catch(err => {
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          if (err.message == 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            this.setErr(this.bwcErrorProvider.msg(err));
          }
        }
      });
  }

  private addCopayers(wallet, newWallet, isNew): Promise<any> {
    if (!isNew) return Promise.resolve();
    if (wallet.n == 1) return Promise.resolve();

    this.logger.debug(
      `Adding copayers for BCH wallet config: ${wallet.m} - ${wallet.n}`
    );

    return this.walletProvider.copyCopayers(wallet, newWallet);
  }

  private importOrCreate(
    wallet,
    opts
  ): Promise<{
    walletBch: any;
    isNew?: boolean;
  }> {
    return this.walletProvider.fetchStatus(wallet, {}).then(status => {
      opts.singleAddress = status.wallet.singleAddress;
      // first try to import
      return this.profileProvider
        .importWithDerivationPath(opts)
        .then(walletBch => {
          return Promise.resolve({ walletBch });
        })
        .catch(() => {
          this.logger.warn('Could not import. Trying to create wallet');
          return this.profileProvider.createWallet(opts).then(walletBch => {
            return Promise.resolve({ walletBch, isNew: true });
          });
        });
    });
  }

  public openHelpExternalLink(): void {
    let url =
      'https://support.bitpay.com/hc/en-us/articles/115005019583-How-Can-I-Recover-Bitcoin-Cash-BCH-from-My-Wallet-';
    let optIn = true;
    let title = null;
    let message = this.translate.instant(
      'Help and support information is available at the website'
    );
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
