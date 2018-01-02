import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@nsalaun/ng-logger';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

//providers
import { AppProvider } from '../../../providers/app/app';

//pages
import { BackupRequestPage } from '../backup-request/backup-request';
import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';

@Component({
  selector: 'page-collect-email',
  templateUrl: 'collect-email.html',
})
export class CollectEmailPage {
  public showConfirmForm: boolean;

  private walletId: string;
  private emailForm: FormGroup;
  private URL: string;
  private accept: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private fb: FormBuilder,
    private appProvider: AppProvider,
    private http: HttpClient,
    private emailProvider: EmailNotificationsProvider
  ) {
    this.walletId = this.navParams.data.walletId;
    let regex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    this.emailForm = this.fb.group({
      email: [null, [Validators.required, Validators.pattern(regex)]],
      accept: [true],
    });
    this.showConfirmForm = false;
    // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
    this.URL = "https://script.google.com/macros/s/AKfycbwQXvUw6-Ix0cRLMi7hBB8dlgNTCTgwfNIQRds6RypPV7dO8evW/exec";
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CollectEmailPage');
  }

  public skip(): void {
    this.goToBackupRequestPage()
  }

  public showConfirm(): void {
    this.showConfirmForm = !this.showConfirmForm;
  }

  public save(): void {

    let opts = {
      enabled: true,
      email: this.emailForm.value.email
    };
    this.emailProvider.updateEmail(opts);

    if (this.accept) this.collectEmail();
    this.goToBackupRequestPage();
  }

  private goToBackupRequestPage(): void {
    this.navCtrl.push(BackupRequestPage, { walletId: this.walletId });
  }

  private collectEmail(): void {
    const headers: any = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });
    const urlSearchParams = new HttpParams()
      .set('App', this.appProvider.info.nameCase)
      .set('Email', this.emailForm.value.email)
      .set('Platform', 'ionic.Platform.platform()') //TODO ionic.Platform.platform()
      .set('DeviceVersion', 'ionic.Platform.version()') //TODO ionic.Platform.version()

    this.http.post(this.URL, null, {
      params: urlSearchParams,
      headers: headers
    }).subscribe(() => {
      this.logger.info("SUCCESS: Email collected");
    }, (err) => {
      this.logger.error("ERROR: Could not collect email");
    });
  };
}
