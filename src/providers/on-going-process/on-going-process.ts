import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

@Injectable()
export class OnGoingProcessProvider {
  private loading: any;
  private processNames: any;

  constructor(
    private loadingCtrl: LoadingController,
  ) {
    console.log('Hello OnGoingProcessProvider Provider');
    // TODO gettextcatalog()
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

  public set(processName: string, isOn: boolean, customHandler?: any) {
    if (!isOn) {
      this.loading.dismiss();
      return;
    }
    this.loading = this.loadingCtrl.create({
      content: this.processNames[processName]
    });
    this.loading.present();
  }
}