import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class DownloadProvider {
  constructor(private logger: Logger) {
    this.logger.info('DownloadProvider initialized.');
  }

  public download(ew, fileName: string): Promise<any> {
    return new Promise(resolve => {
      let a = document.createElement('a');
      let blob = this.newBlob(ew, 'text/plain;charset=utf-8');
      let url = window.URL.createObjectURL(blob);

      document.body.appendChild(a);

      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      return resolve();
    });
  }

  private newBlob(data, datatype: string) {
    let out;
    try {
      out = new Blob([data], {
        type: datatype
      });
      this.logger.debug('case 1');
    } catch (e) {
      if (e.name == 'InvalidStateError') {
        // InvalidStateError (tested on FF13 WinXP)
        out = new Blob([data], {
          type: datatype
        });
        this.logger.debug('case 2');
      } else {
        // We're screwed, blob constructor unsupported entirely
        this.logger.debug('Error');
      }
    }
    return out;
  }
}
