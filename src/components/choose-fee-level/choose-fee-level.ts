import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Slides } from 'ionic-angular';
import * as _ from 'lodash';
import { Coin, CurrencyProvider } from '../../providers/currency/currency';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FeeProvider } from '../../providers/fee/fee';
import { Logger } from '../../providers/logger/logger';
import { PopupProvider } from '../../providers/popup/popup';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

interface FeeOpts {
  feeUnit: string;
  feeUnitAmount: number;
  blockTime: number;
}
@Component({
  selector: 'page-choose-fee-level',
  templateUrl: 'choose-fee-level.html'
})
export class ChooseFeeLevelComponent extends ActionSheetParent {
  @ViewChild('feeSlides')
  feeSlides: Slides;
  private blockTime: number;
  private FEE_MULTIPLIER: number = 10;
  private FEE_MIN: number = 0;
  private feeUnitAmount: number;
  public feeUnit: string;
  public maxFeeRecommended: number;
  public minFeeRecommended: number;
  private minFeeAllowed: number;
  public maxFeeAllowed: number;

  public network: string;
  public feeLevel: string;
  public customFeePerKB: string;
  public feePerSatByte: string;
  public feeOpts = [];
  public loadingFee: boolean;
  public feeLevels;
  public coin: Coin;
  public avgConfirmationTime: number;
  public customSatPerByte: number;
  public maxFee: number;
  public minFee: number;
  public showError: boolean;
  public showMaxWarning: boolean;
  public showMinWarning: boolean;
  public okText: string;
  public cancelText: string;

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    public feeProvider: FeeProvider,
    private translate: TranslateService,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    super();
  }

  ngOnInit() {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    // From parent controller
    this.network = this.params.network;
    this.coin = this.params.coin;
    this.feeLevel = this.params.feeLevel;
    this.setFeeUnits();

    // IF usingCustomFee
    this.customFeePerKB = this.params.customFeePerKB
      ? this.params.customFeePerKB
      : null;
    this.feePerSatByte = this.params.feePerSatByte
      ? this.params.feePerSatByte
      : null;

    if (_.isEmpty(this.feeLevel))
      this.showErrorAndClose(
        null,
        this.translate.instant('Fee level is not defined')
      );

    this.loadingFee = true;
    this.feeProvider
      .getFeeLevels(this.coin)
      .then(levels => {
        this.loadingFee = false;
        if (_.isEmpty(levels)) {
          this.showErrorAndClose(
            null,
            this.translate.instant('Could not get fee levels')
          );
          return;
        }
        this.feeLevels = levels;
        this.setFeeRates();
        if (this.customFeePerKB) this._setCustomFee();
      })
      .catch(err => {
        this.loadingFee = false;
        this.showErrorAndClose(null, err);
        return;
      });
  }

  private setFeeUnits() {
    const {
      feeUnit,
      feeUnitAmount,
      blockTime
    }: FeeOpts = this.currencyProvider.getFeeUnits(this.coin);
    this.feeUnit = feeUnit;
    this.feeUnitAmount = feeUnitAmount;
    this.blockTime = blockTime;
  }

  public setFeeRates() {
    this.feeLevels.levels[this.network].forEach((feeLevel, i) => {
      this.feeOpts[i] = feeLevel;
      this.feeOpts[i].feePerSatByte = (
        feeLevel.feePerKb / this.feeUnitAmount
      ).toFixed();
      let avgConfirmationTime = feeLevel.nbBlocks * this.blockTime;
      this.feeOpts[i].avgConfirmationTime = avgConfirmationTime;

      if (feeLevel.level == this.feeLevel)
        this.feePerSatByte = (
          this.feeOpts[i].feePerKb / this.feeUnitAmount
        ).toFixed();
    });

    setTimeout(() => {
      const index = this.feeOpts
        .map(feeOpt => feeOpt.level)
        .indexOf(this.feeLevel);
      index == -1
        ? this.feeSlides.slideTo(this.feeSlides.length(), 200)
        : this.feeSlides.slideTo(index, 200);
    }, 300);

    // Warnings
    this.setFeesRecommended();
    this.checkFees(this.feePerSatByte);
  }

  public _setCustomFee() {
    this.avgConfirmationTime = null;
    this.customSatPerByte = Number(this.customFeePerKB) / this.feeUnitAmount;
  }

  public setCustomFee() {
    this.changeSelectedFee('custom');
  }

  private showErrorAndClose(title?: string, msg?: string): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.dismiss();
    });
  }

  public setFeesRecommended(): void {
    this.maxFeeRecommended = this.getMaxRecommended();
    this.minFeeRecommended = this.getMinRecommended();
    this.minFeeAllowed = this.FEE_MIN;
    this.maxFeeAllowed = this.maxFeeRecommended * this.FEE_MULTIPLIER;
    this.maxFee =
      this.maxFeeRecommended > this.maxFeeAllowed
        ? this.maxFeeRecommended
        : this.maxFeeAllowed;
    this.minFee =
      this.minFeeRecommended < this.minFeeAllowed
        ? this.minFeeRecommended
        : this.minFeeAllowed;
  }

  private getMinRecommended(): number {
    let value = _.find(this.feeLevels.levels[this.network], feeLevel => {
      return feeLevel.level == 'superEconomy';
    });

    return parseInt((value.feePerKb / this.feeUnitAmount).toFixed(), 10);
  }

  private getMaxRecommended(): number {
    let value = _.find(this.feeLevels.levels[this.network], feeLevel => {
      return feeLevel.level == 'urgent';
    });

    return parseInt((value.feePerKb / this.feeUnitAmount).toFixed(), 10);
  }

  public checkFees(feePerSatByte: string): void {
    let fee = Number(feePerSatByte);
    this.showError = fee <= this.minFeeAllowed ? true : false;
    this.showMinWarning =
      fee > this.minFeeAllowed && fee < this.minFeeRecommended ? true : false;
    this.showMaxWarning =
      fee < this.maxFeeAllowed && fee > this.maxFeeRecommended ? true : false;
  }

  public changeSelectedFee(feeLevel): void {
    this.logger.debug('New fee level: ' + feeLevel);
    this.feeLevel = feeLevel;
    this.customFeePerKB = this.customSatPerByte
      ? (this.customSatPerByte * this.feeUnitAmount).toFixed()
      : null;

    this.dismiss({
      newFeeLevel: this.feeLevel,
      customFeePerKB: this.customFeePerKB,
      showMinWarning: this.showMinWarning
    });
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }
}
