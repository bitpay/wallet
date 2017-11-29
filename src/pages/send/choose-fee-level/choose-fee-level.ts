import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Providers
import { FeeProvider } from '../../../providers/fee/fee';
import { PopupProvider } from '../../../providers/popup/popup';

@Component({
  selector: 'page-choose-fee-level',
  templateUrl: 'choose-fee-level.html',
})
export class ChooseFeeLevelPage {

  private FEE_MULTIPLIER: number = 10;
  private FEE_MIN: number = 0;
  public maxFeeRecommended: number;
  public minFeeRecommended: number;
  private minFeeAllowed: number;
  public maxFeeAllowed: number;

  public network: string;
  public feeLevel: string;
  public customFeePerKB: string;
  public feePerSatByte: string;
  public selectedFee: string;
  public feeOpts: Array<any>;
  public loadingFee: boolean;
  public feeLevels: any;
  public coin: string;
  public avgConfirmationTime: number;
  public customSatPerByte: number;
  public maxFee: number;
  public minFee: number;
  public showError: boolean;
  public showMaxWarning: boolean;
  public showMinWarning: boolean;



  constructor(
    private viewCtrl: ViewController,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private feeProvider: FeeProvider
  ) {
    // From parent controller
    this.network = this.viewCtrl.data.network;
    this.feeLevel = this.viewCtrl.data.feeLevel;

    // IF usingCustomFee
    this.customFeePerKB = this.viewCtrl.data.customFeePerKB ? this.viewCtrl.data.customFeePerKB : null;
    this.feePerSatByte = this.viewCtrl.data.feePerSatByte ? this.viewCtrl.data.feePerSatByte : null;

    if (_.isEmpty(this.feeLevel)) this.showErrorAndClose(null, 'Fee level is not defined'); // TODO: GetTextCatalog
    this.selectedFee = this.feeLevel;

    this.feeOpts = Object.keys(this.feeProvider.feeOpts);
    this.loadingFee = true;
    this.feeProvider.getFeeLevels(this.coin).then((levels: any) => {
      this.loadingFee = false;
      if (_.isEmpty(levels)) {
        this.showErrorAndClose(null, 'Could not get fee levels'); // TODO: GetTextCatalog
        return;
      }
      this.feeLevels = levels;
      this.updateFeeRate();
    }).catch((err: any) => {
      this.loadingFee = false;
      this.showErrorAndClose(null, err);
      return;
    });
  }

  public close() {
    this.viewCtrl.dismiss({ newFeeLevel: "Hola mundo" });
  }

  private showErrorAndClose(title: string, msg: string): void {
    title = title ? title : 'Error'; // TODO: GetTextCatalog
    this.logger.error(msg);
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.viewCtrl.dismiss();
    });
  }

  public updateFeeRate() {
    let value: any = _.find(this.feeLevels.levels[this.network], (feeLevel: any) => {
      return feeLevel.level == this.feeLevel;
    });

    // If no custom fee
    if (value) {
      this.customFeePerKB = null;
      this.feePerSatByte = (value.feePerKb / 1000).toFixed();
      this.avgConfirmationTime = value.nbBlocks * 10;
    } else {
      this.avgConfirmationTime = null;
      this.customSatPerByte = Number(this.feePerSatByte);
      this.customFeePerKB = (+this.feePerSatByte * 1000).toFixed();
    }

    // Warnings
    this.setFeesRecommended();
    this.checkFees(this.feePerSatByte);
  }

  public setFeesRecommended(): void {
    this.maxFeeRecommended = this.getMaxRecommended();
    this.minFeeRecommended = this.getMinRecommended();
    this.minFeeAllowed = this.FEE_MIN;
    this.maxFeeAllowed = this.maxFeeRecommended * this.FEE_MULTIPLIER;
    this.maxFee = this.maxFeeRecommended > this.maxFeeAllowed ? this.maxFeeRecommended : this.maxFeeAllowed;
    this.minFee = this.minFeeRecommended < this.minFeeAllowed ? this.minFeeRecommended : this.minFeeAllowed;
  }

  private getMinRecommended(): number {
    let value: any = _.find(this.feeLevels.levels[this.network], (feeLevel: any) => {
      return feeLevel.level == 'superEconomy';
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  }

  private getMaxRecommended(): number {
    let value: any = _.find(this.feeLevels.levels[this.network], (feeLevel: any) => {
      return feeLevel.level == 'urgent';
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  }

  public checkFees(feePerSatByte: string): void {
    let fee = Number(feePerSatByte);


    if (fee <= this.minFeeAllowed) this.showError = true;
    else this.showError = false;

    if (fee > this.minFeeAllowed && fee < this.minFeeRecommended) this.showMinWarning = true;
    else this.showMinWarning = false;

    if (fee < this.maxFeeAllowed && fee > this.maxFeeRecommended) this.showMaxWarning = true;
    else this.showMaxWarning = false;
  }

  public ok(): void {
    this.customFeePerKB = this.customFeePerKB ? (this.customSatPerByte * 1000).toFixed() : null;
    this.viewCtrl.dismiss({ newFeeLevel: this.feeLevel, customFeePerKB: this.customFeePerKB });
  }

  public changeSelectedFee(newFeeLevelValue: string): void {
    if (this.feeLevel != newFeeLevelValue) {
      this.logger.debug('New fee level: ' + newFeeLevelValue);
      this.feeLevel = newFeeLevelValue;
      this.updateFeeRate();
    }
  }

}
