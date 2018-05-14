import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

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
    this.ongoingProcess = [];
    this.processNames = {
      'broadcastingTx': 'Broadcasting transaction...',
      'calculatingFee': 'Calculating fee...',
      'connectingCoinbase': 'Connecting to Coinbase...',
      'connectingGlidera': 'Connecting to Glidera...',
      'connectingShapeshift': 'Connecting to ShapeShift...',
      'creatingTx': 'Creating transaction...',
      'creatingWallet': 'Creating Wallet...',
      'deletingWallet': 'Deleting Wallet...',
      'extractingWalletInfo': 'Extracting Wallet information...',
      'fetchingPayPro': 'Fetching payment information...',
      'generatingCSV': 'Generating .csv file...',
      'gettingFeeLevels': 'Getting fee levels...',
      'importingWallet': 'Importing Wallet...',
      'joiningWallet': 'Joining Wallet...',
      'recreating': 'Recreating Wallet...',
      'rejectTx': 'Rejecting payment proposal...',
      'removeTx': 'Deleting payment proposal...',
      'retrievingInputs': 'Retrieving inputs information...',
      'scanning': 'Scanning Wallet funds...',
      'sendingTx': 'Sending transaction...',
      'signingTx': 'Signing transaction...',
      'sweepingWallet': 'Sweeping Wallet...',
      'validatingWords': 'Validating recovery phrase...',
      'loadingTxInfo': 'Loading transaction info...',
      'sendingFeedback': 'Sending feedback...',
      'generatingNewAddress': 'Generating new address...',
      'sendingByEmail': 'Preparing addresses...',
      'sending2faCode': 'Sending 2FA code...',
      'buyingBitcoin': 'Buying Bitcoin...',
      'sellingBitcoin': 'Selling Bitcoin...',
      'fetchingBitPayAccount': 'Fetching BitPay Account...',
      'fetchingBitPayCards': 'Fetching BitPay Cards...',
      'updatingGiftCards': 'Updating Gift Cards...',
      'updatingGiftCard': 'Updating Gift Card...',
      'cancelingGiftCard': 'Canceling Gift Card...',
      'creatingGiftCard': 'Creating Gift Card...',
      'buyingGiftCard': 'Buying Gift Card...',
      'topup': 'Top up in progress...',
      'duplicatingWallet': 'Duplicating wallet...'
    };
  }

  public translateOnGoingProcessNames() {
    _.forEach(this.processNames, (process, key) => {
      this.getTranslation(process).then((processTranslated: string) => {
        this.processNames[key] = processTranslated;
      });
    });
  }

  public getTranslation(processName: string): Promise<string> {
    return new Promise((resolve) => {
      this.translate.get(processName).subscribe((processTranslated: string) => {
        return resolve(processTranslated);
      })
    });
  }

  public clear() {
    this.ongoingProcess = [];
    try {
      this.loading.dismiss();
    } catch (e) {
      // No problem
      this.logger.warn('on-going-process is still active. No problem.', e);
    };
    this.loading = null;
    this.logger.debug('ongoingProcess clear');
  }

  public pause(): void {
    this.pausedOngoingProcess = this.ongoingProcess;
    this.clear();
  }

  public resume(): void {
    this.ongoingProcess = this.pausedOngoingProcess;
    _.forEach(this.pausedOngoingProcess, (v) => {
      this.set(v);
      return;
    });
    this.pausedOngoingProcess = [];
  }

  public set(processName: string): void {
    this.logger.debug('ongoingProcess active: ', processName);
    this.ongoingProcess.push(processName);
    let showName = this.processNames[processName] || processName;
    if (!this.loading) {
      this.loading = this.loadingCtrl.create();
    }
    this.loading.setContent(showName);
    this.loading.present();
  }
}
