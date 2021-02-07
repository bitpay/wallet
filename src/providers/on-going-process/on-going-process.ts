import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class OnGoingProcessProvider {
  private loading;
  private pausedOngoingProcess;
  private ongoingProcess;

  constructor(
    private loadingCtrl: LoadingController,
    private logger: Logger,
    private translate: TranslateService
  ) {
    this.logger.debug('OnGoingProcessProvider initialized');
    // TODO GET - CLEAR - CHECK DecimalPipe for FILTER WITH TRANSLATE
    this.ongoingProcess = [];
  }

  private getProcessNames() {
    const processNames = {
      broadcastingTx: this.translate.instant('Broadcasting transaction...'),
      calculatingFee: this.translate.instant('Calculating fee...'),
      calculatingSendMax: this.translate.instant('Calculating send max...'),
      connectingChangelly: this.translate.instant('Connecting to Changelly...'),
      connectingCoinbase: this.translate.instant('Connecting to Coinbase...'),
      creatingTx: this.translate.instant('Creating transaction...'),
      creatingWallet: this.translate.instant('Creating Wallet...'),
      creatingEthMultisigWallet: this.translate.instant(
        'Creating ETH multisig wallet. Please wait...'
      ),
      deletingWallet: this.translate.instant('Deleting Wallet...'),
      extractingWalletInfo: this.translate.instant(
        'Extracting Wallet information...'
      ),
      fetchingPayPro: this.translate.instant('Fetching payment information...'),
      fetchingPayProOptions: this.translate.instant(
        'Fetching payment options...'
      ),
      generatingCSV: this.translate.instant('Generating .csv file...'),
      gettingFeeLevels: this.translate.instant('Getting fee levels...'),
      importingWallet: this.translate.instant('Importing Wallet...'),
      joiningWallet: this.translate.instant('Joining Wallet...'),
      recreating: this.translate.instant('Recreating Wallet...'),
      rejectTx: this.translate.instant('Rejecting payment proposal...'),
      removeTx: this.translate.instant('Deleting payment proposal...'),
      retrievingInputs: this.translate.instant(
        'Retrieving inputs information...'
      ),
      scanning: this.translate.instant('Scanning Wallet funds...'),
      sendingTx: this.translate.instant('Sending transaction...'),
      signingTx: this.translate.instant('Signing transaction...'),
      sweepingWallet: this.translate.instant('Sweeping Wallet...'),
      validatingWords: this.translate.instant('Validating recovery phrase...'),
      loadingTxInfo: this.translate.instant('Loading transaction info...'),
      sendingFeedback: this.translate.instant('Sending feedback...'),
      generatingNewAddress: this.translate.instant('Generating new address...'),
      sendingByEmail: this.translate.instant('Preparing addresses...'),
      sending2faCode: this.translate.instant('Sending 2FA code...'),
      buyingBitcoin: this.translate.instant('Buying Bitcoin...'),
      sellingBitcoin: this.translate.instant('Selling Bitcoin...'),
      fetchingBitPayAccount: this.translate.instant(
        'Fetching BitPay Account...'
      ),
      fetchingBitPayCards: this.translate.instant('Fetching BitPay Cards...'),
      updatingGiftCards: this.translate.instant('Updating Gift Cards...'),
      updatingGiftCard: this.translate.instant('Updating Gift Card...'),
      cancelingGiftCard: this.translate.instant('Canceling Gift Card...'),
      creatingGiftCard: this.translate.instant('Creating Gift Card...'),
      buyingGiftCard: this.translate.instant('Buying Gift Card...'),
      topup: this.translate.instant('Top up in progress...'),
      duplicatingWallet: this.translate.instant('Duplicating wallet...'),
      connectingBitPayId: this.translate.instant('Connecting BitPay ID...'),
      processingOrderReservation: this.translate.instant(
        'Processing order reservation...'
      ),
      payingWithCoinbase: this.translate.instant(
        'Paying with a Coinbase Account...'
      ),
      generalAwaiting: this.translate.instant(
        "Just a second, we're setting a few things up."
      )
    };
    return processNames;
  }

  public clear() {
    this.ongoingProcess = [];
    try {
      this.loading.dismiss();
    } catch (e) {
      // No problem
      this.logger.warn('no active on-going-process. No problem.', e);
    }
    this.loading = null;
    this.logger.debug('ongoingProcess clear');
  }

  public pause(): void {
    this.pausedOngoingProcess = this.ongoingProcess;
    this.clear();
  }

  public resume(): void {
    this.ongoingProcess = this.pausedOngoingProcess;
    _.forEach(this.pausedOngoingProcess, v => {
      this.set(v);
      return;
    });
    this.pausedOngoingProcess = [];
  }

  public set(processName: string): void {
    this.logger.debug('ongoingProcess active: ', processName);
    this.ongoingProcess.push(processName);
    let showName = this.getProcessNames()[processName] || processName;
    if (!this.loading) {
      this.loading = this.loadingCtrl.create();
    }
    this.loading.setContent(showName);
    this.loading.present();
  }
}
