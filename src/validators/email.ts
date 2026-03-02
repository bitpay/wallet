import { FormControl } from '@angular/forms';
import { ConfigProvider } from '../providers/config/config';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';

export class EmailValidator {
  static cnf: ConfigProvider;
  static eml: EmailNotificationsProvider;

  constructor(cnf: ConfigProvider, eml: EmailNotificationsProvider) {
    EmailValidator.cnf = cnf;
    EmailValidator.eml = eml;
  }

  isValid(control: FormControl) {
    let config = EmailValidator.cnf.get();
    let latestEmail = EmailValidator.eml.getEmailIfEnabled(config);

    let validEmail = /^[a-zA-Z0-9.!#$%&*+=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      control.value
    );
    if (validEmail && control.value != latestEmail) {
      return null;
    }

    return {
      'Invalid Email': true
    };
  }
}
