import { PlatformProvider } from '../platform/platform';
import { Logger } from '@nsalaun/ng-logger';

export class LocalStorage {
  constructor(private platform: PlatformProvider, private log: Logger) {
  }
}
