import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../../providers/wallet/wallet';
import { ConfigProvider } from '../../../../../../providers/config/config';
import { TxFormatProvider } from '../../../../../../providers/tx-format/tx-format';
import { BwcErrorProvider } from '../../../../../../providers/bwc-error/bwc-error';
import { PopupProvider } from '../../../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../../../providers/on-going-process/on-going-process';

import * as _ from 'lodash';

@Component({
  selector: 'page-all-addresses',
  templateUrl: 'all-addresses.html',
})
export class AllAddressesPage {

  //TODO
}