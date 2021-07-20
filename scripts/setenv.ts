require('dotenv').config();
var fs = require('fs');
const yargs = require('yargs');
const environments = ["development", "production", "desktop"]
const argv =   yargs.alias('v', 'version')
                    .alias('h', 'help')
                    .usage('Usage: Set environment variables to the angular environment file')
                    .showHelpOnFail(false, 'Specify --help for avalable options')
                    .options({
                        a: {
                            type: 'string',
                            alias: 'awsUrl',
                        },
                        env: {
                            type: 'string',
                            alias: 'environment',
                            choices: environments,
                            demandOption: true
                        }
                    })
                    .argv;

const environment = argv.env;
const awsUrlCLI = argv.a;
let nameEnv = '';
let enableAnimations = process.env.ENABLE_ANIMATIONS;
let activateScanner = process.env.ACTIVATE_SCANNER;
let awsUrl = awsUrlCLI && (awsUrlCLI as string).length > 0 ? awsUrlCLI : process.env.AWS_URL_CONFIG;
if (environment === 'production') {
    nameEnv = 'production';
} else if (environment === 'development') {
    nameEnv = 'development';
} else if(environment === 'desktop'){
    nameEnv = 'production';
}
const targetPath = `./src/environments/index.ts`;
const envConfigFile = `
import { CurrencyProvider } from '../providers/currency/currency';
/**
 * Environment: '${nameEnv}'
 */
export const env = { 
    name: '${nameEnv}', 
    enableAnimations: ${enableAnimations},
    ratesAPI: new CurrencyProvider().getRatesApi(),
    activateScanner: ${activateScanner},
    awsUrl: '${awsUrl}' 
};
    export default env;`
fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        console.log(err);
    }
});  
