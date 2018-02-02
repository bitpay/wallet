import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class OnGoingProcessProvider {

  private loading: any;
  private processNames: any;
  private pausedOngoingProcess: any;
  private ongoingProcess: any;

  constructor(
    private loadingCtrl: LoadingController,
    private logger: Logger,
    private translate: TranslateService
  ) {
    this.logger.info('OnGoingProcessProvider initialized.');
    // TODO GET - CLEAR - CHECK DecimalPipe for FILTER WITH TRANSLATE
    this.processNames = {
      'broadcastingTx': this.translate.instant('Broadcasting transaction...'),
      'calculatingFee': this.translate.instant('Calculating fee...'),
      'connectingCoinbase': this.translate.instant('Connecting to Coinbase...'),
      'connectingGlidera': this.translate.instant('Connecting to Glidera...'),
      'connectingShapeshift': this.translate.instant('Connecting to Shapeshift...'),
      'creatingTx': this.translate.instant('Creating transaction...'),
      'creatingWallet': this.translate.instant('Creating Wallet...'),
      'deletingWallet': this.translate.instant('Deleting Wallet...'),
      'extractingWalletInfo': this.translate.instant('Extracting Wallet information...'),
      'fetchingPayPro': this.translate.instant('Fetching payment information'),
      'generatingCSV': this.translate.instant('Generating .csv file...'),
      'gettingFeeLevels': this.translate.instant('Getting fee levels...'),
      'importingWallet': this.translate.instant('Importing Wallet...'),
      'joiningWallet': this.translate.instant('Joining Wallet...'),
      'recreating': this.translate.instant('Recreating Wallet...'),
      'rejectTx': this.translate.instant('Rejecting payment proposal...'),
      'removeTx': this.translate.instant('Deleting payment proposal...'),
      'retrievingInputs': this.translate.instant('Retrieving inputs information'),
      'scanning': this.translate.instant('Scanning Wallet funds...'),
      'sendingTx': this.translate.instant('Sending transaction...'),
      'signingTx': this.translate.instant('Signing transaction...'),
      'sweepingWallet': this.translate.instant('Sweeping Wallet...'),
      'validatingWords': this.translate.instant('Validating recovery phrase...'),
      'loadingTxInfo': this.translate.instant('Loading transaction info...'),
      'sendingFeedback': this.translate.instant('Sending feedback...'),
      'generatingNewAddress': this.translate.instant('Generating new address...'),
      'sendingByEmail': this.translate.instant('Preparing addresses...'),
      'sending2faCode': this.translate.instant('Sending 2FA code...'),
      'buyingBitcoin': this.translate.instant('Buying Bitcoin...'),
      'sellingBitcoin': this.translate.instant('Selling Bitcoin...'),
      'fetchingBitPayAccount': this.translate.instant('Fetching BitPay Account...'),
      'updatingGiftCards': this.translate.instant('Updating Gift Cards...'),
      'updatingGiftCard': this.translate.instant('Updating Gift Card...'),
      'cancelingGiftCard': this.translate.instant('Canceling Gift Card...'),
      'creatingGiftCard': this.translate.instant('Creating Gift Card...'),
      'buyingGiftCard': this.translate.instant('Buying Gift Card...'),
      'topup': this.translate.instant('Top up in progress...'),
      'duplicatingWallet': this.translate.instant('Duplicating wallet...'),
    };
    this.ongoingProcess = {};
  }

  private clear() {
    this.ongoingProcess = {};
    this.loading.dismiss();
  }

  public pause(): void {
    this.pausedOngoingProcess = this.ongoingProcess;
    this.clear();
  }

  public resume(): void {
    _.forEach(this.pausedOngoingProcess, (v, k) => {
      this.set(k, v);
    });
    this.pausedOngoingProcess = {};
  }

  public set(processName: string, isOn: boolean): string {
    this.logger.debug('ongoingProcess', processName, isOn);
    this.ongoingProcess[processName] = isOn;
    let showName = this.processNames[processName] || processName;
    if (!isOn) {
      delete this.ongoingProcess[processName];
      this.loading.dismiss();
      return;
    }
    this.loading = this.loadingCtrl.create({
      content: showName
    });
    this.loading.present();
  }
}
