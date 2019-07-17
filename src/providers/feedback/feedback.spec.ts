import { HttpClient } from '@angular/common/http';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import { Observable } from 'rxjs/Observable';
import { TestUtils } from '../../test';
import { AppProvider } from '../app/app';
import { Logger } from '../logger/logger';
import { FeedbackProvider } from './feedback';

describe('FeedbackProvider', () => {
  let feedbackProvider: FeedbackProvider;
  let httpClient: HttpClient;
  let logger: Logger;

  class AppProviderMock {
    public servicesInfo = {};
    constructor() {
      this.servicesInfo = { feedbackSheetURL: 'https://...' };
    }
  }

  beforeEach(async () => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: AppProvider, useClass: AppProviderMock }
    ]);
    feedbackProvider = testBed.get(FeedbackProvider);
    httpClient = testBed.get(HttpClient);
    logger = testBed.get(Logger);
  });

  describe('send function', () => {
    it('return promise resolve if everything is ok', () => {
      const dataSrc = {
        email: ' ',
        feedback: ' ',
        score: ' ',
        appVersion: '',
        platform: 'Unknown platform',
        deviceVersion: 'Unknown version'
      };

      spyOn(httpClient, 'post').and.returnValue(Observable.of(''));
      const loggerSpy = spyOn(logger, 'info');

      feedbackProvider
        .send(dataSrc)
        .then(() => {
          expect(loggerSpy).toHaveBeenCalled();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
    it('return promise reject if http fails', () => {
      const dataSrc = {
        email: ' ',
        feedback: ' ',
        score: ' ',
        appVersion: '',
        platform: 'Unknown platform',
        deviceVersion: 'Unknown version'
      };

      spyOn(httpClient, 'post').and.returnValue(Observable.throw('error'));
      const loggerSpy = spyOn(logger, 'warn');

      feedbackProvider.send(dataSrc).catch(() => {
        expect(loggerSpy).toHaveBeenCalled();
      });
    });
  });

  describe('isVersionUpdated function', () => {
    it('reject if cannot verify the format of version tag', () => {
      const currentVersion = 'SomethingWrong.4.6';
      const savedVersion = '5.3.4';
      const isVersionUpdatedSpy = feedbackProvider.isVersionUpdated(
        currentVersion,
        savedVersion
      );
      expect(isVersionUpdatedSpy).toBe(
        'Cannot verify the format of version tag: ' + currentVersion
      );
    });
    it('reject if cannot verify the format of the saved version tag', () => {
      const currentVersion = '5.4.6';
      const savedVersion = 'SomethingWrong.3.4';
      const isVersionUpdatedSpy = feedbackProvider.isVersionUpdated(
        currentVersion,
        savedVersion
      );
      expect(isVersionUpdatedSpy).toBe(
        'Cannot verify the format of the saved version tag: ' + savedVersion
      );
    });
    it('return true if the version is updated', () => {
      const currentVersion = '5.4.6';
      const savedVersion = '5.3.4';
      const isVersionUpdatedSpy = feedbackProvider.isVersionUpdated(
        currentVersion,
        savedVersion
      );
      expect(isVersionUpdatedSpy).toBeTruthy();
    });
    it('return false if the version is not updated', () => {
      const currentVersion = '4.2.6';
      const savedVersion = '5.3.4';
      const isVersionUpdatedSpy = feedbackProvider.isVersionUpdated(
        currentVersion,
        savedVersion
      );
      expect(isVersionUpdatedSpy).toBeFalsy();
    });
  });
});
