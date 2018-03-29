import development from './dev';
import { EnvironmentSchema } from './schema';

const env: EnvironmentSchema = {
  // Start with development config,
  ...development,
  // override for e2e testing:
  name: 'e2e'
};

export default env;
