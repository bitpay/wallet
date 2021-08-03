import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// Pages
import { ConfirmPage } from '../../../../pages/send/confirm/confirm';

// Providers
import {
  ErrorsProvider,
  Logger,
  PopupProvider,
  ProfileProvider,
  ReplaceParametersProvider,
  WalletConnectProvider
} from '../../../../providers';

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
    eth_signTypedData: 'Approve'
  };
  public request: any;
  public params: any;
  public peerMeta: any;
  public wallet: any;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private walletConnectProvider: WalletConnectProvider,
    private errorsProvider: ErrorsProvider,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {}

  ionViewDidLoad() {
    this.getConnectionData();
    this.request = this.navParams.data.request;
    this.params = this.navParams.data.params;
  }

  private getConnectionData: any = async _ => {
    const {
      walletId,
      address,
      peerMeta
    } = await this.walletConnectProvider.getConnectionData();
    this.wallet = this.profileProvider.getWallet(walletId);
    this.address = address;
    this.peerMeta = peerMeta;
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
}
