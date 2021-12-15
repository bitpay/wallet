import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// native
import { Device } from '@ionic-native/device/ngx';
import { AppProvider } from 'src/app/providers/app/app';
import { EmailNotificationsProvider } from 'src/app/providers/email-notifications/email-notifications';
import { Logger } from 'src/app/providers/logger/logger';
import { PlatformProvider } from 'src/app/providers/platform/platform';

@Component({
  selector: 'page-collect-email',
  templateUrl: 'collect-email.html',
  styleUrls: ['collect-email.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CollectEmailPage {
  public showConfirmForm: boolean;

  emailForm: FormGroup;
  private URL: string;

  constructor(
    private logger: Logger,
    private fb: FormBuilder,
    private appProvider: AppProvider,
    private http: HttpClient,
    private emailProvider: EmailNotificationsProvider,
    private device: Device,
    private platformProvider: PlatformProvider
  ) {
    const regex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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

  ngOnInit(){
    this.logger.info('Loaded: CollectEmailPage');
  }

  public showConfirm(): void {
    this.showConfirmForm = !this.showConfirmForm;
  }

  public save(): void {
    const opts = {
      enabled: true,
      email: this.emailForm.value.email
    };

    // Confirm for notifications
    this.emailProvider.updateEmail(opts);

    // Confirm to get news and updates from BitPay
    if (this.emailForm.value.accept) this.collectEmail();
  }

  private collectEmail(): void {
    if (!this.URL) return;

    let version;
    let platform;

    if (this.platformProvider.isElectron) {
      version = this.platformProvider
        .getDeviceInfo()
        .match(/(Electron[\/]\d+(\.\d)*)/i)[0]; // getDeviceInfo example: 5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Copay/5.1.0 Chrome/66.0.3359.181 Electron/3.0.8 Safari/537.36
      platform =
        this.platformProvider.getOS() && this.platformProvider.getOS().OSName;
    } else {
      version = this.device.version || 'Unknown version';
      platform = this.device.platform || 'Unknown platform';
    }

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
  skip() {}
}
