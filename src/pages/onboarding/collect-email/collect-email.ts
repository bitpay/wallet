import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// native
import { Device } from '@ionic-native/device';

// providers
import { AppProvider } from '../../../providers/app/app';

// pages
import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { BackupRequestPage } from '../backup-request/backup-request';

@Component({
  selector: 'page-collect-email',
  templateUrl: 'collect-email.html'
})
export class CollectEmailPage {
  public showConfirmForm: boolean;

  private walletId: string;
  private emailForm: FormGroup;
  private URL: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private fb: FormBuilder,
    private appProvider: AppProvider,
    private http: HttpClient,
    private emailProvider: EmailNotificationsProvider,
    private device: Device
  ) {
    this.walletId = this.navParams.data.walletId;
    let regex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.emailForm = this.fb.group({
      email: [null, [Validators.required, Validators.pattern(regex)]],
      accept: [false]
    });
    this.showConfirmForm = false;
    // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
    this.URL =
      this.appProvider.servicesInfo &&
      this.appProvider.servicesInfo.emailSheetURL
        ? this.appProvider.servicesInfo.emailSheetURL
        : null;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CollectEmailPage');
  }

  public skip(): void {
    this.goToBackupRequestPage();
  }

  public showConfirm(): void {
    this.showConfirmForm = !this.showConfirmForm;
  }

  public save(): void {
    let opts = {
      enabled: true,
      email: this.emailForm.value.email
    };

    // Confirm for notifications
    this.emailProvider.updateEmail(opts);

    // Confirm to get news and updates from BitPay
    if (this.emailForm.value.accept) this.collectEmail();

    this.goToBackupRequestPage();
  }

  private goToBackupRequestPage(): void {
    this.navCtrl.push(BackupRequestPage, { walletId: this.walletId });
  }

  private collectEmail(): void {
    if (!this.URL) return;

    let platform = this.device.platform || 'Unknown platform';
    let version = this.device.version || 'Unknown version';

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    });
    const urlSearchParams = new HttpParams()
      .set('App', this.appProvider.info.nameCase)
      .set('Email', this.emailForm.value.email)
      .set('AppVersion', this.appProvider.info.version)
      .set('Platform', platform)
      .set('DeviceVersion', version);

    this.http
      .post(this.URL, null, {
        params: urlSearchParams,
        headers
      })
      .subscribe(
        () => {
          this.logger.info('SUCCESS: Email collected');
        },
        () => {
          this.logger.error('ERROR: Could not collect email');
        }
      );
  }
}
