import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../providers/logger/logger';

// services
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';

// validators
import { EmailValidator } from '../../../validators/email';
import { Location } from '@angular/common';

@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html',
  styleUrls: ['notifications.scss']
})
export class NotificationsPage {
  public emailForm: FormGroup;
  public isCopay: boolean;

  public appName: string;
  public usePushNotifications: boolean;
  public isIOSApp: boolean;
  public isElectron: boolean;

  public pushNotifications: boolean;
  public desktopNotifications: boolean;
  public confirmedTxsNotifications: boolean;
  public productsUpdates: boolean;
  public offersAndPromotions: boolean;

  public emailNotifications: boolean;

  constructor(
    private location: Location,
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
    this.isCopay = this.appProvider.info.name == 'copay' ? true : false;
  }

  ngOnInit(){
    this.logger.info('Loaded: NotificationsPage');
    this.updateConfig();
  }

  private updateConfig() {
    const config = this.configProvider.get();
    this.appName = this.appProvider.info.nameCase;
    this.usePushNotifications = this.platformProvider.isCordova;
    this.isIOSApp =
      this.platformProvider.isIOS && this.platformProvider.isCordova;
    this.isElectron = this.platformProvider.isElectron;

    this.pushNotifications = config.pushNotifications
      ? config.pushNotifications.enabled
      : false;
    this.desktopNotifications = config.desktopNotifications
      ? config.desktopNotifications.enabled
      : false;
    this.confirmedTxsNotifications = config.confirmedTxsNotifications
      ? config.confirmedTxsNotifications.enabled
      : false;
    this.productsUpdates = config.productsUpdates
      ? config.productsUpdates.enabled
      : false;
    this.offersAndPromotions = config.offersAndPromotions
      ? config.offersAndPromotions.enabled
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
      pushNotifications: { enabled: this.pushNotifications }
    };

    this.configProvider.set(opts);

    if (opts.pushNotifications.enabled) this.pushProvider.init();
    else this.pushProvider.disable();
  }

  public desktopNotificationChange() {
    const opts = {
      desktopNotifications: { enabled: this.desktopNotifications }
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

  public async productsUpdatesChange() {
    const opts = {
      productsUpdates: {
        enabled: this.productsUpdates
      }
    };
    this.configProvider.set(opts);
    await this.updateTopic(this.productsUpdates, 'productsupdates');
  }

  public async offersAndPromotionsChange() {
    const opts = {
      offersAndPromotions: {
        enabled: this.offersAndPromotions
      }
    };
    this.configProvider.set(opts);
    await this.updateTopic(this.offersAndPromotions, 'offersandpromotions');
  }

  public async updateTopic(enabled, topic) {
    if (enabled)  await this.pushProvider.subscribeToTopic(topic);
    else await this.pushProvider.unsubscribeFromTopic(topic);
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
    this.location.back();
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Notice');
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
