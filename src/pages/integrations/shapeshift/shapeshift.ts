import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { ShapeshiftDetailsPage } from './shapeshift-details/shapeshift-details';
import { ShapeshiftShiftPage } from './shapeshift-shift/shapeshift-shift';

// Providers
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ShapeshiftProvider } from '../../../providers/shapeshift/shapeshift';
import { ThemeProvider } from '../../../providers/theme/theme';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-shapeshift',
  templateUrl: 'shapeshift.html'
})
export class ShapeshiftPage {
  public shifts;
  public network: string;
  public oauthCodeForm: FormGroup;
  public showOauthForm: boolean;
  public accessToken: string;
  public code: string;
  public loading: boolean;
  public error: string;
  public headerColor: string;

  constructor(
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private shapeshiftProvider: ShapeshiftProvider,
    private timeProvider: TimeProvider,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private onGoingProcessProvider: OnGoingProcessProvider,
    protected translate: TranslateService,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private themeProvider: ThemeProvider
  ) {
    this.oauthCodeForm = this.formBuilder.group({
      code: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.showOauthForm = false;
    this.network = this.shapeshiftProvider.getNetwork();
    this.shifts = { data: {} };
    this.headerColor = '#0d172c';
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ShapeshiftPage');
  }

  ionViewWillEnter() {
    if (this.platformProvider.isCordova) {
      this.themeProvider.useCustomStatusBar(this.headerColor);
    }
    if (this.navParams.data.code) {
      this.shapeshiftProvider.getStoredToken((at: string) => {
        at ? this.init() : this.submitOauthCode(this.navParams.data.code);
      });
    } else {
      this.init();
    }

    this.events.subscribe('bwsEvent', this.bwsEventHandler);
  }

  ionViewWillLeave() {
    if (this.platformProvider.isCordova) {
      this.themeProvider.useDefaultStatusBar();
    }
    this.events.unsubscribe('bwsEvent', this.bwsEventHandler);
  }

  private bwsEventHandler: any = (_, type: string) => {
    if (type == 'NewBlock') this.updateShift(this.shifts);
  };

  private init(): void {
    this.loading = true;
    this.shapeshiftProvider.getStoredToken((at: string) => {
      this.accessToken = at;
      // Update Access Token if necessary
      this.shapeshiftProvider.init((err, data) => {
        if (err || _.isEmpty(data)) {
          this.loading = false;
          if (err) {
            this.logger.error(err);
            this.loading = false;
            if (err == 'unverified_account') {
              this.openShafeShiftWindow();
            } else {
              this.popupProvider
                .ionicAlert(
                  this.translate.instant('Error connecting to ShapeShift'),
                  err
                )
                .then(() => {
                  this.shapeshiftProvider.logout(this.accessToken);
                  this.navCtrl.popToRoot();
                });
            }
          }
          return;
        }

        this.shapeshiftProvider.getShapeshift((err, ss) => {
          this.loading = false;
          if (err) this.logger.error(err);
          if (ss) this.shifts = { data: ss };
          this.updateShift(this.shifts);
        });
      });
    });
  }

  public openExternalLink(url: string): void {
    this.externalLinkProvider.open(url);
  }

  private getInfo(data, at, cb) {
    if (data && data.orderId)
      return this.shapeshiftProvider.getOrderInfo(data.orderId, at, cb);
    return this.shapeshiftProvider.getStatus(data.address, at, cb);
  }

  private updateShift = _.debounce(
    shifts => {
      if (_.isEmpty(shifts.data)) return;
      _.forEach(shifts.data, dataFromStorage => {
        if (!this.checkIfShiftNeedsUpdate(dataFromStorage)) return;

        this.getInfo(dataFromStorage, this.accessToken, (err, st) => {
          if (err) return;

          this.shifts.data[dataFromStorage.address] = _.assign(
            this.shifts.data[dataFromStorage.address],
            {
              status: st.status || dataFromStorage.status || null,
              error: st.error || dataFromStorage.error || null,
              transaction:
                st.transaction || dataFromStorage.transaction || null,
              incomingCoin:
                st.incomingCoin || dataFromStorage.incomingCoin || null,
              incomingType:
                st.incomingType || dataFromStorage.incomingType || null,
              outgoingCoin:
                st.outgoingCoin || dataFromStorage.outgoingCoin || null,
              outgoingType:
                st.outgoingType || dataFromStorage.outgoingType || null
            }
          );
          this.shapeshiftProvider.saveShapeshift(
            this.shifts.data[dataFromStorage.address],
            null,
            () => {
              this.logger.debug(
                'Saved shift with status: ' + (st.status || st.error)
              );
            }
          );
        });
      });
    },
    3000,
    {
      leading: true
    }
  );

  private checkIfShiftNeedsUpdate(shiftData) {
    // Continues normal flow (update shiftData)
    if (shiftData.status == 'received') {
      return true;
    }
    // Check if shiftData status FAILURE for 24 hours
    if (
      (shiftData.status == 'failed' ||
        shiftData.status == 'no_deposits' ||
        shiftData.status == 'expired' ||
        !shiftData.status) &&
      this.timeProvider.withinPastDay(shiftData.date)
    ) {
      return true;
    }
    // If status is complete: do not update
    // If status fails or do not receive deposits for more than 24 hours: do not update
    return false;
  }

  public update(): void {
    this.updateShift(this.shifts);
  }

  public openShiftModal(ssData) {
    const modal = this.modalCtrl.create(ShapeshiftDetailsPage, { ssData });

    modal.present();

    modal.onDidDismiss(() => {
      this.init();
    });
  }

  public goTo(page: string): void {
    switch (page) {
      case 'Shift':
        this.navCtrl.push(ShapeshiftShiftPage);
        break;
    }
  }

  public openAuthenticateWindow(): void {
    this.showOauthForm = true;
    const oauthUrl = this.shapeshiftProvider.getOauthCodeUrl();
    this.externalLinkProvider.open(oauthUrl);
  }

  private openShafeShiftWindow(): void {
    const url = 'https://portal.shapeshift.io/me/fox/dashboard';
    const optIn = true;
    const title = this.translate.instant('Unverified Account');
    const message = this.translate.instant(
      'Do you want to verify your account now?'
    );
    const okText = this.translate.instant('Verify Account');
    const cancelText = this.translate.instant('Cancel');
    this.externalLinkProvider
      .open(url, optIn, title, message, okText, cancelText)
      .then(() => {
        this.navCtrl.popToRoot();
      });
  }

  public openSignupWindow(): void {
    const url = this.shapeshiftProvider.getSignupUrl();
    const optIn = true;
    const title = 'Sign Up for ShapeShift';
    const message =
      'This will open shapeshift.io, where you can create an account.';
    const okText = 'Go to ShapeShift';
    const cancelText = 'Back';
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public submitOauthCode(code: string): void {
    this.onGoingProcessProvider.set('connectingShapeshift');
    this.shapeshiftProvider.getToken(code, (err: any, accessToken: string) => {
      this.onGoingProcessProvider.clear();
      if (err) {
        this.error = err;
        this.logger.error('Error connecting to ShapeShift: ' + err);
        return;
      }
      this.navCtrl.pop();
      this.accessToken = accessToken;
      this.init();
    });
  }
}
