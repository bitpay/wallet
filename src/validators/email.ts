import { FormControl } from '@angular/forms';
import { ConfigProvider } from '../providers/config/config';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';

export class EmailValidator {

  public static cnf: ConfigProvider;
  public static eml: EmailNotificationsProvider;

  constructor(cnf: ConfigProvider, eml: EmailNotificationsProvider) {
    EmailValidator.cnf = cnf;
    EmailValidator.eml = eml;
  }

  public isValid(control: FormControl): any {

    const config = EmailValidator.cnf.get();
    const latestEmail = EmailValidator.eml.getEmailIfEnabled(config);

    const validEmail = (/^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/).test(control.value);
    if (validEmail && control.value != latestEmail) {
      return null;
    }

    return {
      "Invalid Email": true
    };
  }
}
