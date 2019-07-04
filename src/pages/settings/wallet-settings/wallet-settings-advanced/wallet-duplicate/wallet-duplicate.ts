import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../../providers/logger/logger';

// Providers
import { AppProvider } from '../../../../../providers/app/app';
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../../../providers/derivation-path-helper/derivation-path-helper';
import { ExternalLinkProvider } from '../../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';
import { ReplaceParametersProvider } from '../../../../../providers/replace-parameters/replace-parameters';
import { TxFormatProvider } from '../../../../../providers/tx-format/tx-format';
import { Coin, WalletProvider } from '../../../../../providers/wallet/wallet';
import { WalletTabsChild } from '../../../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../../../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-wallet-duplicate',
  templateUrl: 'wallet-duplicate.html'
})
export class WalletDuplicatePage extends WalletTabsChild {
  comment: any;
  defaults: any;

  public availableWallet;
  public nonEligibleWallet;
  public error;
  public wallet;

  constructor(
    private walletProvider: WalletProvider,
    private app: AppProvider,
    private txFormatProvider: TxFormatProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    public navCtrl: NavController,
    public profileProvider: ProfileProvider,
    public walletTabsProvider: WalletTabsProvider,
    public derivationPathHelperProvider: DerivationPathHelperProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.defaults = this.configProvider.getDefaults();
  }

  ionViewWillEnter() {
    const appName = this.app.info.nameCase;
    const derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
      this.wallet.credentials.rootPath
    );
    this.comment = this.replaceParametersProvider.replace(
      this.translate.instant(
        'To recover BCH from your {{appName}} Wallet, you must duplicate your BTC wallet. We strongly recommend you protect your wallets with a password to keep your funds safe.'
      ),
      { appName }
    );

    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
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

    this.walletProvider
      .getBalance(this.availableWallet, { coin: 'bch' })
      .then(balance => {
        this.availableWallet.bchBalance = this.txFormatProvider.formatAmountStr(
          'bch',
          balance.availableAmount
        );
        this.availableWallet.error = null;
      })
      .catch(err => {
        this.availableWallet.error =
          err === 'WALLET_NOT_REGISTERED'
            ? this.translate.instant('Wallet not registered')
            : this.bwcErrorProvider.msg(err);
        this.logger.error(err);
      });
  }

  private setErr(err) {
    const errorMsg = this.bwcErrorProvider.msg(err, 'Could not duplicate');
    this.logger.warn('Duplicate BCH', errorMsg);
    this.popupProvider.ionicAlert(errorMsg, null, 'OK');
    return;
  }

  public duplicate(wallet) {
    this.logger.info(
      `Duplicating wallet for BCH: ${wallet.id} - ${wallet.name}`
    );

    let opts: any = {
      name: wallet.name + '[BCH]',
      m: wallet.m,
      n: wallet.n,
      myName: wallet.credentials.copayerName,
      networkName: wallet.network,
      coin: Coin.BCH,
      walletPrivKey: wallet.credentials.walletPrivKey,
      compliantDerivation: wallet.credentials.compliantDerivation,
      bwsurl: this.defaults.bws.url
    };

    this.walletProvider
      .getKeys(wallet)
      .then(keys => {
        this.onGoingProcessProvider.set('duplicatingWallet');
        this.importOrCreate(wallet, keys, opts)
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
                this.close();
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
          this.setErr(this.bwcErrorProvider.msg(err));
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
    keys,
    opts
  ): Promise<{
    walletBch: any;
    isNew?: boolean;
  }> {
    return this.walletProvider.fetchStatus(wallet, {}).then(status => {
      opts.singleAddress = status.wallet.singleAddress;
      // first try to import
      return this.profileProvider
        .importExtendedPrivateKey(keys.xPrivKey, opts)
        .then(newWallet => {
          let walletBch;

          newWallet.forEach(wallet => {
            if (wallet.coin === 'bch') {
              walletBch = wallet;
            }
          });

          if (walletBch) {
            return Promise.resolve({ walletBch });
          } else {
            opts.extendedPrivateKey = keys.xPrivKey;
            opts.useLegacyCoinType = true;
            const addingNewWallet = false;
            return this.profileProvider
              .createWallet(addingNewWallet, opts)
              .then(walletBch => {
                return Promise.resolve({ walletBch, isNew: true });
              });
          }
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
