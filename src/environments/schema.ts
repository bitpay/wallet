import { CoinsMap } from '../providers/currency/currency';
/**
 * Copay does not yet build with Angular CLI, but our environment system works
 * the same way.
 */
export interface EnvironmentSchema {
  name: 'production' | 'development';
  enableAnimations: boolean;
  ratesAPI: CoinsMap<string>;
  activateScanner: boolean;
}
