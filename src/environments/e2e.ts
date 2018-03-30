import development from './dev';
import { EnvironmentSchema } from './schema';

/**
 * Environment: e2e
 */
const env: EnvironmentSchema = {
  // Start with development config,
  ...development,
  // override for e2e testing:
  name: 'e2e',
  enableAnimations: false
};

export default env;
