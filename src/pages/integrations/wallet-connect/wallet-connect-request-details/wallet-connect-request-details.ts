import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import _ from 'lodash';

// Pages
import { FinishModalPage } from '../../../../pages/finish/finish';
import { ConfirmPage } from '../../../../pages/send/confirm/confirm';

// Providers
import {
  ActionSheetProvider,
  BwcErrorProvider,
  BwcProvider,
  ConfigProvider,
  CurrencyProvider,
  ErrorsProvider,
  ExternalLinkProvider,
  Logger,
  OneInchProvider,
  OnGoingProcessProvider,
  PopupProvider,
  ProfileProvider,
  RateProvider,
  ReplaceParametersProvider,
  TxFormatProvider,
  WalletConnectProvider,
  WalletProvider
} from '../../../../providers';
import { TransactionProposal } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-connect-request-details',
  templateUrl: 'wallet-connect-request-details.html'
})
export class WalletConnectRequestDetailsPage {
  public address: string;
  public buttonAction = {
    eth_sendTransaction: 'Confirm',
    eth_signTransaction: 'Approve',
    eth_sign: 'Approve',
    personal_sign: 'Approve',
    eth_signTypedData: 'Approve',
    eth_signTypedData_v4: 'Approve'
  };
  public request: any;
  public params: any;
  public peerMeta: any;
  public wallet: any;
  public dappImgSrc: string;
  private defaultImgSrc: string = 'assets/img/wallet-connect/icon-dapp.svg';
  public isSupportedMethod: boolean = true;
  public token: any;
  public alternativeIsoCode: string;
  public feeRate;
  public fiatFee;
  public ctxp;
  private errors;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletConnectProvider: WalletConnectProvider,
    private errorsProvider: ErrorsProvider,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private replaceParametersProvider: ReplaceParametersProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider,
    private oneInchProvider: OneInchProvider,
    private currencyProvider: CurrencyProvider,
    private walletProvider: WalletProvider,
    private rateProvider: RateProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private bwcProvider: BwcProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private modalCtrl: ModalController
  ) {}

  async ionViewDidLoad() {
    await this.setConnectionData();
    this.request = this.navParams.data.request;
    this.params = this.navParams.data.params;
    this.isSupportedMethod = this.walletConnectProvider.isSupportedMethod(
      this.request.method
    );
    this.alternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';

    if (this.request.method === 'eth_sendTransaction') {
      this.errors = this.bwcProvider.getErrors();
      this.buildTxp();
    }
  }

  // not ideal - workaround for navCtrl issues
  ionViewWillEnter() {
    this.events.publish('Update/ViewingWalletConnectDetails', true);
  }
  ionViewWillLeave() {
    this.events.publish('Update/ViewingWalletConnectDetails', false);
  }

  private setConnectionData: any = async _ => {
    const {
      walletId,
      address,
      peerMeta
    } = await this.walletConnectProvider.getConnectionData();
    this.wallet = this.profileProvider.getWallet(walletId);
    this.address = address;
    this.peerMeta = peerMeta;
    this.setDappImgSrc();
  };

  public rejectRequest(request): void {
    this.walletConnectProvider.rejectRequest(request).then(_ => {
      this.navCtrl.pop();
    });
  }

  public approveRequest(request): void {
    try {
      let addressRequested;
      const address = this.address;
      switch (request.method) {
        case 'eth_sendTransaction':
          addressRequested = request.params[0].from;
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            this.makePayment();
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4':
          addressRequested = request.params[0];
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            const result = this.walletConnectProvider.signTypedData(
              JSON.parse(request.params[1]),
              this.wallet
            );
            this.walletConnectProvider.approveRequest(request.id, result);
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        case 'personal_sign':
          addressRequested = request.params[1];
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            const result = this.walletConnectProvider.personalSign(
              request.params[0],
              this.wallet
            );
            this.walletConnectProvider.approveRequest(request.id, result);
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        case 'eth_sign':
          addressRequested = request.params[0];
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            const result = this.walletConnectProvider.personalSign(
              request.params[1],
              this.wallet
            );
            this.walletConnectProvider.approveRequest(request.id, result);
          } else {
            this.errorsProvider.showDefaultError(
              this.translate.instant(
                'Address requested does not match active account'
              ),
              this.translate.instant('Error')
            );
          }
          break;
        default:
          this.errorsProvider.showDefaultError(
            `Not supported method: ${request.method}`,
            this.translate.instant('Error')
          );
          break;
      }
    } catch (error) {
      this.logger.error('Wallet Connect - ApproveRequest error: ', error);
      this.errorsProvider.showDefaultError(
        error,
        this.translate.instant('Error')
      );
    }
  }

  public openConfirmPageConfirmation(peerMeta, data): void {
    const title = this.translate.instant('Confirm Request');
    const message = this.replaceParametersProvider.replace(
      this.translate.instant(
        `Please make sure {{peerMetaName}} request is still waiting for confirmation, and that the amount is correct before proceeding to the confirmation step`
      ),
      { peerMetaName: peerMeta.name }
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go Back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.navCtrl.push(ConfirmPage, data);
        }
      });
  }

  public setDappImgSrc(useDefault?: boolean) {
    this.dappImgSrc =
      this.peerMeta && this.peerMeta.icons && !useDefault
        ? this.peerMeta.icons[1]
          ? this.peerMeta.icons[1]
          : this.peerMeta.icons[0]
        : this.defaultImgSrc;
  }

  public openExternalLink(): void {
    this.externalLinkProvider.open(
      'https://docs.walletconnect.org/json-rpc-api-methods/ethereum'
    );
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
  }

  private async buildTxp() {
    this.onGoingProcessProvider.set(
      this.translate.instant('Verifying token approval data...')
    );
    try {
      await this.setTokenData();
      this.ctxp = await this.createTx();
      if (this.ctxp.fee) {
        this.fiatFee = this.rateProvider.toFiat(
          this.ctxp.fee,
          this.alternativeIsoCode,
          'eth'
        );
      }
      this.onGoingProcessProvider.clear();
    } catch (err) {
      this.onGoingProcessProvider.clear();
      const isInsufficientFundsErr =
        err instanceof this.errors.INSUFFICIENT_FUNDS;
      const isInsufficientFundsForFeeErr =
        err instanceof this.errors.INSUFFICIENT_FUNDS_FOR_FEE;

      if (isInsufficientFundsErr || isInsufficientFundsForFeeErr) {
        let { requiredFee } = err.messageData;

        const coin = this.wallet.coin.toLowerCase();
        let feeCoin = 'eth';

        const feeAlternative = this.txFormatProvider.formatAlternativeStr(
          feeCoin,
          requiredFee
        );
        const fee = this.txFormatProvider.formatAmountStr(feeCoin, requiredFee);

        const insufficientFundsInfoSheet = this.actionSheetProvider.createInfoSheet(
          'insufficient-funds-for-fee',
          {
            fee,
            feeAlternative,
            coin,
            isERCToken: this.currencyProvider.isERCToken(coin),
            canChooseFeeLevel: false
          }
        );
        insufficientFundsInfoSheet.present();
        insufficientFundsInfoSheet.onDidDismiss(option => {
          if (option) {
            this.externalLinkProvider.open(
              'https://support.bitpay.com/hc/en-us/articles/115003393863-What-are-bitcoin-miner-fees-'
            );
          }
        });
      } else {
        this.showError(err.title, err.message);
      }
    }
  }

  private async setTokenData() {
    try {
      // approach to get the token symbol and icon
      const allTokens = await this.oneInchProvider.getCurrencies1inch();
      this.token = allTokens.tokens[this.params[0].to];
    } catch {
      this.logger.warn('Wallet Connect - Token not found');
    }
  }

  private createTx(): Promise<any> {
    return new Promise((resolve, reject) => {
      let message = this.token.name + ' Approve';
      let outputs = [];

      outputs.push({
        toAddress: this.params[0].to,
        amount: 0,
        message,
        data: this.params[0].data,
        gasLimit: this.params[0].gas
      });

      let txp: Partial<TransactionProposal> = {
        toAddress: this.params[0].to,
        amount: this.params[0].value,
        outputs,
        message,
        excludeUnconfirmedUtxos: true // Do not use unconfirmed UTXOs,
      };

      this.walletProvider
        .createTx(this.wallet, txp)
        .then(ctxp => {
          return resolve(ctxp);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public canContinue() {
    if (this.request && this.request.method === 'eth_sendTransaction') {
      return !_.isEmpty(this.ctxp);
    } else {
      return this.isSupportedMethod;
    }
  }

  public makePayment() {
    this.onGoingProcessProvider.set('broadcastingTx');

    this.publishAndSign(this.wallet, this.ctxp)
      .then(async _txSent => {
        this.onGoingProcessProvider.clear();
        this.openFinishModal();
        try {
          await this.walletConnectProvider.closeRequest(this.request.id);
        } catch (err) {
          this.logger.warn(err);
        }
      })
      .catch(err => {
        this.logger.error(this.bwcErrorProvider.msg(err));
        this.showError(null, err);
        this.logger.warn('Error on publishAndSign: removing payment proposal');
        this.walletProvider.removeTx(this.wallet, this.ctxp).catch(() => {
          this.logger.warn('Could not delete payment proposal');
        });
        return;
      });
  }

  private publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign) {
        let err = this.translate.instant('No signing proposal: No private key');
        return reject(err);
      }

      this.walletProvider
        .publishAndSign(wallet, txp)
        .then(txp => {
          this.onGoingProcessProvider.clear();
          return resolve(txp);
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();

          return reject(err);
        });
    });
  }

  private showError(title: string, msg): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.error && msg.error.message ? msg.error.message : msg;
    const errorActionSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      {
        msg,
        title
      }
    );
    this.onGoingProcessProvider.clear();
    errorActionSheet.present();
  }

  private openFinishModal(): void {
    let finishText = 'Transaction Sent';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, coin: this.wallet.coin },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.pop();
    });
  }
}
