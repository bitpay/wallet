import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';

// validators
import { EmailValidator } from '../../../validators/email';

@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html'
})
export class NotificationsPage {
  public emailForm: FormGroup;

  public appName: string;
  public usePushNotifications: boolean;
  public isIOSApp: boolean;

  public pushNotifications: boolean;
  public inAppNotifications: boolean;
  public confirmedTxsNotifications: boolean;

  public emailNotifications: boolean;

  constructor(
    private navCtrl: NavController,
    private formBuilder: FormBuilder,
    private configProvider: ConfigProvider,
    private appProvider: AppProvider,
    private platformProvider: PlatformProvider,
    private pushProvider: PushNotificationsProvider,
    private emailProvider: EmailNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.emailForm = this.formBuilder.group({
      email: [
        '',
        Validators.compose([
          Validators.required,
          new EmailValidator(configProvider, emailProvider).isValid
        ])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: NotificationsPage');
    this.updateConfig();
  }

  private updateConfig() {
    const config = this.configProvider.get();
    this.appName = this.appProvider.info.nameCase;
    this.usePushNotifications = this.platformProvider.isCordova;
    this.isIOSApp =
      this.platformProvider.isIOS && this.platformProvider.isCordova;

    this.pushNotifications = config.pushNotificationsEnabled;
    this.inAppNotifications = config.inAppNotificationsEnabled;
    this.confirmedTxsNotifications = config.confirmedTxsNotifications
      ? config.confirmedTxsNotifications.enabled
      : false;

    this.emailForm.setValue({
      email: this.emailProvider.getEmailIfEnabled(config) || ''
    });

    this.emailNotifications = config.emailNotifications
      ? config.emailNotifications.enabled
      : false;
  }

  public pushNotificationsChange() {
    const opts = {
      pushNotificationsEnabled: this.pushNotifications
    };

    this.configProvider.set(opts);

    if (opts.pushNotificationsEnabled) this.pushProvider.init();
    else this.pushProvider.disable();
  }

  public inAppNotificationChange() {
    const opts = {
      inAppNotificationsEnabled: this.inAppNotifications
    };

    this.configProvider.set(opts);
  }

  public confirmedTxsNotificationsChange() {
    const opts = {
      confirmedTxsNotifications: {
        enabled: this.confirmedTxsNotifications
      }
    };
    this.configProvider.set(opts);
  }

  public emailNotificationsChange() {
    const opts = {
      enabled: this.emailNotifications,
      email: this.emailForm.value.email
    };
    this.emailProvider.updateEmail(opts);
  }

  public saveEmail() {
    this.persistenceProvider.setEmailLawCompliance('accepted');
    this.emailProvider.updateEmail({
      enabled: this.emailNotifications,
      email: this.emailForm.value.email
    });
    this.navCtrl.pop();
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Policy');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
