import { Injectable } from '@angular/core';

@Injectable()
export class TextService {

  gettext(inputString) {
    return inputString;
  }

  gettextCatalog: any = {
    getString: (inputString) => { return inputString; },
    setCurrentLanguage: () => {}
  }

}
