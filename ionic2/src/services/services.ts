import { AppConfigService } from './app-config.service';
import { BwcErrorService } from './bwc-error.service';
import { BwcService } from './bwc.service';
import { ConfigService } from './config.service';
import { IncomingDataService } from './incoming-data.service';
import { PayproService } from './paypro.service';
import { PlatformInfo } from './platform-info.service';
import { ProfileService } from './profile.service';
import { PushNotificationService } from './push-notification.service';
import { RateService } from './rate.service';
import { ScannerService } from './scanner.service';
import { StorageService } from './storage.service';
import { TextService } from './text.service';
import { UxLanguageService } from './ux-language.service';

export const SERVICES = [
  AppConfigService,
  BwcErrorService,
  BwcService,
  ConfigService,
  IncomingDataService,
  PayproService,
  PlatformInfo,
  ProfileService,
  PushNotificationService,
  RateService,
  ScannerService,
  StorageService,
  TextService,
  UxLanguageService
];
