import { Observable } from 'rxjs';
import { Logger } from '../../providers/logger/logger';
import { TestUtils } from '../../test';
import { DownloadProvider } from './download';

describe('DownloadProvider', () => {
  let downloadProvider: DownloadProvider;
  let logger: Logger;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    downloadProvider = testBed.get(DownloadProvider);
    logger = testBed.get(Logger);
  });

  describe('download function', () => {
    it('should download logs', () => {
      const logs =
        'Session Logs.\nBe careful, this could contain sensitive private data\n\n';
      const filename = 'BitPay-logs 2019-05-23T18:10:20.140Z.txt';
      let blobMock = new Blob([''], { type: 'text/html' });
      blobMock['name'] = 'filename';
      blobMock['body'] = logs;
      spyOn(downloadProvider, 'newBlob').and.returnValue(blobMock);

      spyOn(Observable, 'timer').and.returnValue({
        toPromise: () => {
          return true;
        }
      });

      downloadProvider
        .download(logs, filename)
        .then(() => {
          expect(downloadProvider.newBlob).toHaveBeenCalled();
        })
        .catch(err => expect(err).toBeUndefined());
    });
  });

  describe('newBlob function', () => {
    it('should create a Blob available to download', () => {
      const logs =
        'Session Logs.\nBe careful, this could contain sensitive private data\n\n';
      const dataType = 'text/plain;charset=utf-8';
      const newBlob = downloadProvider.newBlob(logs, dataType);
      expect(newBlob).toBeDefined();
    });

    it('should fails If it can not create a new Blob ', () => {
      const logs =
        'Session Logs.\nBe careful, this could contain sensitive private data\n\n';
      const dataType = 'text/plain;charset=utf-8';
      const loggerErrorSpy = spyOn(logger, 'error');
      spyOn(logger, 'debug').and.throwError('InvalidStateError');

      downloadProvider.newBlob(logs, dataType);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should fails If it can not create a new Blob ', () => {
      const logs =
        'Session Logs.\nBe careful, this could contain sensitive private data\n\n';
      const dataType = 'text/plain;charset=utf-8';
      const loggerErrorSpy = spyOn(logger, 'error');
      spyOn(logger, 'debug').and.throwError('Something Wrong');

      downloadProvider.newBlob(logs, dataType);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
});
