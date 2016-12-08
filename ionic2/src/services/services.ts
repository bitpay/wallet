import { AppConfigService } from './app-config.service';
import { BwcService } from './bwc.service';
import { ConfigService } from './config.service';
import { IncomingDataService } from './incoming-data.service';
import { PlatformInfo } from './platform-info.service';
import { ScannerService } from './scanner.service';
import { StorageService } from './storage.service';

export const SERVICES = [
  AppConfigService,
  BwcService,
  ConfigService,
  IncomingDataService,
  PlatformInfo,
  ScannerService,
  StorageService
];
