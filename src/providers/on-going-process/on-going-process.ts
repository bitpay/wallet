import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

@Injectable()
export class OnGoingProcessProvider {

  private loading: any;
  private processNames: any;

  constructor(
    private loadingCtrl: LoadingController,
    private logger: Logger,
  ) {
    this.logger.info('OnGoingProcessProvider initialized.');
    // TODO gettextcatalog()
    // TODO GET - CLEAR - CHECK DecimalPipe for FILTER WITH TRANSLATE
    this.processNames = {
      'broadcastingTx': 'Broadcasting transaction',
      'calculatingFee': 'Calculating fee',
      'connectingCoinbase': 'Connecting to Coinbase...',
      'connectingGlidera': 'Connecting to Glidera...',
      'creatingTx': 'Creating transaction',
      'creatingWallet': 'Creating Wallet...',
      'deletingWallet': 'Deleting Wallet...',
      'extractingWalletInfo': 'Extracting Wallet information...',
      'fetchingPayPro': 'Fetching payment information',
      'generatingCSV': 'Generating .csv file...',
      'gettingFeeLevels': 'Getting fee levels...',
      'importingWallet': 'Importing Wallet...',
      'joiningWallet': 'Joining Wallet...',
      'recreating': 'Recreating Wallet...',
      'rejectTx': 'Rejecting payment proposal',
      'removeTx': 'Deleting payment proposal',
      'retrievingInputs': 'Retrieving inputs information',
      'scanning': 'Scanning Wallet funds...',
      'sendingTx': 'Sending transaction',
      'signingTx': 'Signing transaction',
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
      'updatingGiftCards': 'Updating Gift Cards...',
      'updatingGiftCard': 'Updating Gift Card...',
      'cancelingGiftCard': 'Canceling Gift Card...',
      'creatingGiftCard': 'Creating Gift Card...',
      'buyingGiftCard': 'Buying Gift Card...',
      'topup': 'Top up in progress...',
      'duplicatingWallet': 'Duplicating wallet...',
    };
  }

  public getShowName(processName: string): string {
    let showName = this.processNames[processName];
    return showName;
  }

  public clear() {
    this.processNames = {};
    this.loading.dismiss();
  };

  public set(processName: string, isOn: boolean, customHandler?: any): string {
    this.logger.debug('ongoingProcess', processName, isOn);
    let showName = this.processNames[processName];
    if (!isOn) {
      this.loading.dismiss();
      return;
    }
    this.loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: showName
    });
    this.loading.present();
  }
}
