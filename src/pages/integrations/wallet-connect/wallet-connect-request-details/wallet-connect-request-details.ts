import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';

// Providers
import {
  BwcErrorProvider,
  CurrencyProvider,
  ErrorsProvider,
  ExternalLinkProvider,
  Logger,
  ProfileProvider,
  WalletConnectProvider
} from '../../../../providers';
@Component({
  selector: 'page-wallet-connect-request-details',
  templateUrl: 'wallet-connect-request-details.html'
})
export class WalletConnectRequestDetailsPage {
  public address: string;
  public request: any;
  public params: any;
  public wallet: any;
  public isSupportedMethod: boolean = true;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletConnectProvider: WalletConnectProvider,
    private errorsProvider: ErrorsProvider,
    private navCtrl: NavController,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    public currencyProvider: CurrencyProvider
  ) {}

  async ionViewDidLoad() {
    await this.setConnectionData();
    this.request = this.navParams.data.request;
    this.params = this.navParams.data.params;
    this.isSupportedMethod = this.walletConnectProvider.isSupportedMethod(
      this.request.method
    );
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
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
      address
    } = await this.walletConnectProvider.getConnectionData();
    this.wallet = this.profileProvider.getWallet(walletId);
    this.address = address;
  };

  public rejectRequest(request): void {
    this.walletConnectProvider.rejectRequest(request.id).then(_ => {
      this.navCtrl.pop();
    });
  }

  public async approveRequest(request) {
    try {
      let addressRequested;
      const address = this.address;
      switch (request.method) {
        case 'eth_signTypedData':
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          addressRequested = request.params[0];
          if (address.toLowerCase() === addressRequested.toLowerCase()) {
            const result = await this.walletConnectProvider.signTypedData(
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
            const result = await this.walletConnectProvider.personalSign(
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
            const result = await this.walletConnectProvider.personalSign(
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
    } catch (err) {
      if (
        err &&
        err.message != 'FINGERPRINT_CANCELLED' &&
        err.message != 'PASSWORD_CANCELLED'
      ) {
        this.logger.error('Wallet Connect - ApproveRequest error: ', err);
        this.errorsProvider.showDefaultError(
          this.bwcErrorProvider.msg(err),
          this.translate.instant('Error')
        );
      }
    }
  }

  public openExternalLink(url): void {
    this.externalLinkProvider.open(url);
  }
}
