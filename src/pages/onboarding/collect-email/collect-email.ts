import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
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
  templateUrl: 'collect-email.html',
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
    let regex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    this.emailForm = this.fb.group({
      email: [null, [Validators.required, Validators.pattern(regex)]],
      accept: [false],
    });
    this.showConfirmForm = false;
    // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
    this.URL = "https://script.google.com/macros/s/AKfycbwQXvUw6-Ix0cRLMi7hBB8dlgNTCTgwfNIQRds6RypPV7dO8evW/exec";
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CollectEmailPage');
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
    let platform = this.device.platform || 'Unknown platform';
    let version = this.device.version || 'Unknown version';

    const headers: any = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });
    const urlSearchParams = new HttpParams()
      .set('App', this.appProvider.info.nameCase)
      .set('Email', this.emailForm.value.email)
      .set('Platform', platform)
      .set('DeviceVersion', version)

    this.http.post(this.URL, null, {
      params: urlSearchParams,
      headers
    }).subscribe(() => {
      this.logger.info("SUCCESS: Email collected");
    }, (err) => {
      this.logger.error("ERROR: Could not collect email");
    });
  };
}
