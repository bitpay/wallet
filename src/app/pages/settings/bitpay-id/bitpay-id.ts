import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, NavParams } from '@ionic/angular';

// providers
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Logger } from 'src/app/providers/logger/logger';
import { PersistenceProvider } from 'src/app/providers/persistence/persistence';
import { PopupProvider } from 'src/app/providers/popup/popup';

@Component({
  selector: 'page-bitpay-id',
  templateUrl: 'bitpay-id.html'
})
export class BitPayIdPage {
  public userBasicInfo;
  public accountInitials: string;
  public network;
  public originalBitpayIdSettings: string;
  public bitpayIdSettings = this.getDefaultBitPayIdSettings();

  constructor(
    private events: EventManagerService,
    private logger: Logger,
    private navParams: NavParams,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private actionSheetProvider: ActionSheetProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.userBasicInfo = this.navParams.data;
    if (this.userBasicInfo) {
      this.accountInitials = this.getBitPayIdInitials(this.userBasicInfo);
    }
    this.changeDetectorRef.detectChanges();
    this.bitpayIdSettings =
      (await this.persistenceProvider.getBitPayIdSettings(this.network)) ||
      this.getDefaultBitPayIdSettings();
    this.originalBitpayIdSettings = JSON.stringify(this.bitpayIdSettings);
    this.logger.info('Loaded: BitPayID page');
  }

  ionViewWillLeave() {
    const settingsChanged =
      this.originalBitpayIdSettings !== JSON.stringify(this.bitpayIdSettings);
    if (settingsChanged) {
      this.events.publish('BitPayId/SettingsChanged');
    }
  }

  getDefaultBitPayIdSettings() {
    return {
      syncGiftCardPurchases: false
    };
  }

  async onSettingsChange() {
    await this.persistenceProvider.setBitPayIdSettings(
      this.network,
      this.bitpayIdSettings
    );
  }

  disconnectBitPayID() {
    this.popupProvider
      .ionicConfirm(
        this.translate.instant('Disconnect BitPay ID'),
        this.translate.instant(
          'Are you sure you would like to disconnect your BitPay ID?'
        )
      )
      .then(async () => {
        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'in-app-notification',
          {
            title: 'BitPay ID',
            body: this.translate.instant('BitPay ID successfully disconnected.')
          }
        );

        infoSheet.present();
        setTimeout(() => {
          this.router.navigate(['']);
        }, 400);
      });
  }

  private getBitPayIdInitials(user): string {
    if (!user) return '';
    const { givenName, familyName } = user;
    return [givenName, familyName]
      .map(name => name && name.charAt(0).toUpperCase())
      .join('');
  }
}
