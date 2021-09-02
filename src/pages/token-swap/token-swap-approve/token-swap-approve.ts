import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { ExchangeCryptoProvider } from '../../../providers/exchange-crypto/exchange-crypto';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { OneInchProvider } from '../../../providers/one-inch/one-inch';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import {
  TransactionProposal,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-token-swap-approve',
  templateUrl: 'token-swap-approve.html'
})
export class TokenSwapApprovePage {
  public isCordova: boolean;
  public fromWalletSelected;
  public fromToken;
  public toToken;
  public calldata;
  public approveSpenderAddress: string;
  public alternativeIsoCode: string;
  public ctxp;
  public fiatFee: number;
  public errors;
  public siteUrl: string;
  public spenderVerified: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private oneInchProvider: OneInchProvider,
    private navCtrl: NavController,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.onGoingProcessProvider.set(
      this.translate.instant('Verifying token approval data...')
    );
    this.isCordova = this.platformProvider.isCordova;
    this.errors = this.bwcProvider.getErrors();
    this.fromWalletSelected = this.profileProvider.getWallet(
      this.navParams.data.fromWalletSelectedId
    );
    this.fromToken = this.navParams.data.fromTokenSelected;
    this.toToken = this.navParams.data.toTokenSelected;
    this.alternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';

    this.getApproveCalldata();
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: TokenSwapApprovePage');
    this.navCtrl.swipeBackEnabled = false;
  }

  public getApproveCalldata() {
    this.oneInchProvider
      .approveSpender1inch()
      .then(async (approveSpenderData: any) => {
        this.approveSpenderAddress = approveSpenderData.address;
        const data = {
          tokenAddress: this.fromToken.address,
          infinity: true
        };

        try {
          const contractApprovalWhitelist: any[] = await this.exchangeCryptoProvider.getSpenderApprovalWhitelist();

          const knownContract = contractApprovalWhitelist.find(contract => {
            return (
              contract.address.toLowerCase() ==
              this.approveSpenderAddress.toLowerCase()
            );
          });

          if (!_.isEmpty(knownContract)) {
            this.logger.debug('Spender address verified: ', knownContract);
            this.siteUrl = knownContract.url;
            this.spenderVerified = true;
          }
        } catch (err) {
          this.logger.debug('Spender address could not be verified: ', err);
          this.spenderVerified = false;
        }

        this.oneInchProvider
          .approveCalldata1inch(data)
          .then(data => {
            this.calldata = data;
            this.createTx(this.fromWalletSelected)
              .then(ctxp => {
                this.ctxp = ctxp;
                if (this.ctxp.fee) {
                  this.fiatFee = this.rateProvider.toFiat(
                    this.ctxp.fee,
                    this.alternativeIsoCode,
                    'eth'
                  );
                }
              })
              .catch(err => {
                this.onGoingProcessProvider.clear();
                const isInsufficientFundsErr =
                  err instanceof this.errors.INSUFFICIENT_FUNDS;
                const isInsufficientFundsForFeeErr =
                  err instanceof this.errors.INSUFFICIENT_FUNDS_FOR_FEE;

                if (isInsufficientFundsErr || isInsufficientFundsForFeeErr) {
                  let { requiredFee } = err.messageData;

                  const coin = this.fromWalletSelected.coin.toLowerCase();
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
                    this.rejectApprove();
                  });
                } else {
                  this.showErrorAndBack(err.title, err.message);
                }

                return;
              });
          })
          .catch(err => {
            this.logger.error('OneInch approveCalldata1inch Error: ', err);
            this.showErrorAndBack(
              null,
              this.translate.instant(
                'OneInch is not available at this moment. Please, try again later.'
              )
            );
          });
      })
      .catch(err => {
        this.logger.error('OneInch approveSpender1inch Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'OneInch is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
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

  public makePayment() {
    this.onGoingProcessProvider.set('broadcastingTx');

    this.publishAndSign(this.fromWalletSelected, this.ctxp)
      .then(txSent => {
        this.onGoingProcessProvider.clear();
        this.viewCtrl.dismiss(txSent);
      })
      .catch(err => {
        this.logger.error(this.bwcErrorProvider.msg(err));
        this.showErrorAndBack(null, err);
        this.logger.warn('Error on publishAndSign: removing payment proposal');
        this.walletProvider
          .removeTx(this.fromWalletSelected, this.ctxp)
          .catch(() => {
            this.logger.warn('Could not delete payment proposal');
          });
        return;
      });
  }

  private createTx(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      let message = this.fromWalletSelected.coin.toUpperCase() + ' Approve';
      let outputs = [];

      outputs.push({
        toAddress: this.calldata.to,
        amount: Number(this.calldata.value),
        message,
        data: this.calldata.data
      });

      let txp: Partial<TransactionProposal> = {
        toAddress: this.calldata.to,
        amount: Number(this.calldata.value),
        outputs,
        message,
        excludeUnconfirmedUtxos: true, // Do not use unconfirmed UTXOs
        customData: {
          oneInch: this.calldata.to,
          service: 'oneInch'
        }
      };

      txp.feePerKb = Number(this.calldata.gasPrice);

      if (this.currencyProvider.isERCToken(wallet.coin)) {
        let tokenAddress;
        let tokens = this.currencyProvider.getAvailableTokens();
        const token = tokens.find(x => x.symbol == wallet.coin.toUpperCase());

        tokenAddress = token.address;

        if (tokenAddress) {
          for (const output of txp.outputs) {
            if (!output.data) {
              output.data = this.bwcProvider
                .getCore()
                .Transactions.get({ chain: 'ERC20' })
                .encodeData({
                  recipients: [
                    { address: output.toAddress, amount: output.amount }
                  ],
                  tokenAddress
                });
            }
          }
        }
      }

      this.walletProvider
        .createTx(wallet, txp)
        .then(ctxp => {
          this.onGoingProcessProvider.clear();
          return resolve(ctxp);
        })
        .catch(err => {
          return reject(err);
        });
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
    this.onGoingProcessProvider.clear();
    errorActionSheet.present();
    errorActionSheet.onDidDismiss(_option => {
      if (!noExit) {
        this.onGoingProcessProvider.clear();
        this.rejectApprove();
      }
    });
  }

  public rejectApprove() {
    this.viewCtrl.dismiss();
  }
}
