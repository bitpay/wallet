import { ChangeDetectorRef, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Pages
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
  FeeProvider,
  Logger,
  OnGoingProcessProvider,
  PlatformProvider,
  PopupProvider,
  ProfileProvider,
  RateProvider,
  ReplaceParametersProvider,
  TxFormatProvider,
  WalletConnectProvider
} from '../../../../providers';
import {
  TransactionProposal,
  WalletProvider
} from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-wallet-connect-request-details',
  templateUrl: 'wallet-connect-request-details.html'
})
export class WalletConnectRequestDetailsPage {
  public isCordova: boolean;
  public address: string;
  public buttonAction = {
    eth_sendTransaction: 'Continue',
    eth_signTransaction: 'Approve',
    eth_sign: 'Approve',
    personal_sign: 'Approve',
    eth_signTypedData: 'Approve',
    eth_signTypedData_v1: 'Approve',
    eth_signTypedData_v3: 'Approve',
    eth_signTypedData_v4: 'Approve'
  };
  public request: any;
  public params: any;
  public peerMeta: any;
  public wallet: any;
  public dappImgSrc: string;
  private defaultImgSrc: string = 'assets/img/wallet-connect/icon-dapp.svg';
  public isSupportedMethod: boolean = true;
  public title: string;
  public ctxp;
  public fiatFee: number;
  public alternativeIsoCode: string;
  public errors;
  public isApproveRequest;

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
    public currencyProvider: CurrencyProvider,
    private walletProvider: WalletProvider,
    private feeProvider: FeeProvider,
    private rateProvider: RateProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private txFormatProvider: TxFormatProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private actionSheetProvider: ActionSheetProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private platformProvider: PlatformProvider,
    private changeRef: ChangeDetectorRef
  ) {}

  async ionViewDidLoad() {
    this.isCordova = this.platformProvider.isCordova;
    await this.setConnectionData();
    this.request = this.navParams.data.request;
    this.params = this.navParams.data.params;
    this.isApproveRequest =
      this.request &&
      this.request.decodedData &&
      this.request.decodedData.name === 'approve';
    this.title = this.isApproveRequest
      ? this.translate.instant('Spender Approval')
      : this.translate.instant('Pending Call Request');
    this.isSupportedMethod = this.walletConnectProvider.isSupportedMethod(
      this.request.method
    );
    this.alternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';
    this.errors = this.bwcProvider.getErrors();
    if (this.isApproveRequest) {
      this.createTx(this.wallet);
    }
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
  }

  private async createTx(wallet) {
    let message = this.request.tokenInfo.symbol + ' Approve';
    let outputs = [];

    let data = {
      amount: this.request.params[0].value,
      toAddress: this.request.params[0].to,
      data: this.request.params[0].data,
      gasLimit: this.request.params[0].gas
    };

    outputs.push({
      toAddress: data.toAddress,
      amount: Number(data.amount),
      message,
      data: data.data,
      gasLimit: data.gasLimit
    });

    let txp: Partial<TransactionProposal> = {
      toAddress: data.toAddress,
      amount: Number(data.amount),
      outputs,
      message,
      excludeUnconfirmedUtxos: true // Do not use unconfirmed UTXOs
    };

    let feeRate;
    try {
      feeRate = await this.feeProvider.getFeeRate(
        wallet.coin,
        wallet.network,
        this.feeProvider.getCoinCurrentFeeLevel(wallet.coin)
      );
    } catch (err) {
      this.onGoingProcessProvider.clear();
      this.showErrorAndBack(err.title, err.message);
      return;
    }

    txp.feePerKb = Number(feeRate);

    this.walletProvider
      .createTx(wallet, txp)
      .then(ctxp => {
        this.onGoingProcessProvider.clear();
        this.ctxp = ctxp;
        if (this.ctxp.fee) {
          this.fiatFee = this.rateProvider.toFiat(
            this.ctxp.fee,
            this.alternativeIsoCode,
            'eth'
          );
        }
        this.changeRef.detectChanges();
      })
      .catch(err => {
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
          const fee = this.txFormatProvider.formatAmountStr(
            feeCoin,
            requiredFee
          );

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
              this.openExternalLink(
                'https://support.bitpay.com/hc/en-us/articles/115003393863-What-are-bitcoin-miner-fees-'
              );
            }
          });
        } else {
          this.showErrorAndBack(err.title, err.message);
        }
      });
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
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
    errorActionSheet.present();
    errorActionSheet.onDidDismiss(_option => {
      if (!noExit) {
        this.navCtrl.pop();
      }
    });
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
      const wallet = this.wallet;
      const peerMeta = this.peerMeta;

      switch (request.method) {
        case 'eth_sendTransaction':
          addressRequested = request.params[0].from;
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            // redirect to confirm page with navParams
            let data = {
              amount: request.params[0].value,
              toAddress: request.params[0].to,
              coin: wallet.credentials.coin,
              walletId: wallet.credentials.walletId,
              network: wallet.network,
              data: request.params[0].data,
              gasLimit: request.params[0].gas,
              walletConnectRequestId: request.id
            };
            this.logger.debug(
              'redirect to confirm page with data: ',
              JSON.stringify(data)
            );
            this.openConfirmPageConfirmation(peerMeta, data);
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
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
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

  public openExternalLink(url): void {
    this.externalLinkProvider.open(url);
  }

  public makePayment() {
    this.onGoingProcessProvider.set('broadcastingTx');

    this.publishAndSign(this.wallet, this.ctxp)
      .then(txp => {
        this.onGoingProcessProvider.clear();
        if (this.request.id) {
          this.walletConnectProvider.approveRequest(this.request.id, txp.txid);
        }
        this.navCtrl.pop();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(this.bwcErrorProvider.msg(err));
        this.showErrorAndBack(null, err);
        this.logger.warn('Error on publishAndSign: removing payment proposal');
        this.walletProvider.removeTx(this.wallet, this.ctxp).catch(() => {
          this.logger.warn('Could not delete payment proposal');
        });
        return;
      });
  }

  private publishAndSign(wallet, txp): Promise<any> {
    if (!wallet.canSign) {
      let err = this.translate.instant('No signing proposal: No private key');
      return Promise.reject(err);
    }
    return this.walletProvider.publishAndSign(wallet, txp);
  }
}
