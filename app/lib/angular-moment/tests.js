/* License: MIT.
 * Copyright (C) 2013, 2014, Uri Shaked.
 */

/* global describe, inject, module, beforeEach, afterEach, it, expect, spyOn */

'use strict';

describe('module angularMoment', function () {
	var $rootScope, $compile, $window, $filter, moment, amTimeAgoConfig, originalTimeAgoConfig, angularMomentConfig,
		originalAngularMomentConfig, amMoment;

	beforeEach(module('angularMoment'));

	beforeEach(inject(function ($injector) {
		$rootScope = $injector.get('$rootScope');
		$compile = $injector.get('$compile');
		$window = $injector.get('$window');
		$filter = $injector.get('$filter');
		moment = $injector.get('moment');
		amMoment = $injector.get('amMoment');
		amTimeAgoConfig = $injector.get('amTimeAgoConfig');
		angularMomentConfig = $injector.get('angularMomentConfig');
		originalTimeAgoConfig = angular.copy(amTimeAgoConfig);
		originalAngularMomentConfig = angular.copy(angularMomentConfig);

		// Ensure the language of moment.js is set to english by default
		moment.lang('en');
		// Add a sample timezone for tests
		moment.tz.add({
			zones: {
				'Pacific/Tahiti': ['-9:58:16 - LMT 1912_9 -9:58:16', '-10 - TAHT']
			}
		});
	}));

	afterEach(function () {
		// Restore original configuration after each test
		angular.copy(originalTimeAgoConfig, amTimeAgoConfig);
		angular.copy(originalAngularMomentConfig, angularMomentConfig);
	});


	describe('am-time-ago directive', function () {
		it('should change the text of the element to "a few seconds ago" when given unix timestamp', function () {
			$rootScope.testDate = new Date().getTime() / 1000;
			var element = angular.element('<span am-time-ago="testDate" am-preprocess="unix"></span>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
		});

		it('should change the text of the element to "a few seconds ago" when given current time', function () {
			$rootScope.testDate = new Date();
			var element = angular.element('<span am-time-ago="testDate"></span>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
		});

		it('should change the text of the div to "3 minutes ago" when given a date 3 minutes ago', function () {
			$rootScope.testDate = new Date(new Date().getTime() - 3 * 60 * 1000);
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('3 minutes ago');
		});

		it('should change the text of the div to "2 hours ago" when given a date 2 hours ago', function () {
			$rootScope.testDate = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('2 hours ago');
		});

		it('should change the text of the div to "one year ago" when given a date one year ago', function () {
			var today = new Date();
			$rootScope.testDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a year ago');
		});

		it('should parse correctly numeric dates as milliseconds since the epoch', function () {
			$rootScope.testDate = new Date().getTime();
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
		});

		it('should update the value if date changes on scope', function () {
			var today = new Date();
			$rootScope.testDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).getTime();
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a year ago');
			$rootScope.testDate = new Date();
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
		});

		it('should update the span text as time passes', function (done) {
			$rootScope.testDate = new Date(new Date().getTime() - 44000);
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');

			var waitsInterval = setInterval(function () {
				// Wait until $rootScope.date is more than 45 seconds old
				if (new Date().getTime() - $rootScope.testDate.getTime() < 45000) {
					return;
				}

				clearInterval(waitsInterval);
				$rootScope.$digest();
				expect(element.text()).toBe('a minute ago');
				done();
			}, 50);
		});

		it('should handle undefined data', function () {
			$rootScope.testDate = null;
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			var digest = function () {
				$rootScope.$digest();
			};
			expect(digest).not.toThrow();
		});

		it('should remove the element text and cancel the timer when an empty string is given (#15)', function () {
			$rootScope.testDate = new Date().getTime();
			var element = angular.element('<div am-time-ago="testDate"></div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
			$rootScope.testDate = '';
			spyOn($window, 'clearTimeout').and.callThrough();
			$rootScope.$digest();
			expect($window.clearTimeout).toHaveBeenCalled();
			expect(element.text()).toBe('');
		});

		it('should not change the contents of the element until a date is given', function () {
			$rootScope.testDate = null;
			var element = angular.element('<div am-time-ago="testDate">Initial text</div>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('Initial text');
			$rootScope.testDate = new Date().getTime();
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
		});

		it('should cancel the timer when the scope is destroyed', function () {
			var scope = $rootScope.$new();
			$rootScope.testDate = new Date();
			var element = angular.element('<span am-time-ago="testDate"></span>');
			element = $compile(element)(scope);
			$rootScope.$digest();
			spyOn($window, 'clearTimeout').and.callThrough();
			scope.$destroy();
			expect($window.clearTimeout).toHaveBeenCalled();
		});

		it('should generate a time string without suffix when configured to do so', function () {
			amTimeAgoConfig.withoutSuffix = true;
			$rootScope.testDate = new Date();
			var element = angular.element('<span am-time-ago="testDate"></span>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds');
		});

		it('should generate update the text following a language change via amMoment.changeLanguage() method', function () {
			$rootScope.testDate = new Date();
			var element = angular.element('<span am-time-ago="testDate"></span>');
			element = $compile(element)($rootScope);
			$rootScope.$digest();
			expect(element.text()).toBe('a few seconds ago');
			amMoment.changeLanguage('fr');
			expect(element.text()).toBe('il y a quelques secondes');
		});

		describe('am-without-suffix attribute', function () {
			it('should generate a time string without suffix when true', function () {
				$rootScope.testDate = new Date();
				var element = angular.element('<span am-time-ago="testDate" am-without-suffix="true"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('a few seconds');
			});

			it('should generate a time string with suffix when false', function () {
				amTimeAgoConfig.withoutSuffix = true;
				$rootScope.testDate = new Date();
				var element = angular.element('<span am-time-ago="testDate" am-without-suffix="false"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('a few seconds ago');
			});

			it('should support expressions', function () {
				$rootScope.testDate = new Date();
				$rootScope.withSuffix = false;
				var element = angular.element('<span am-time-ago="testDate" am-without-suffix="!withSuffix"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('a few seconds');
				$rootScope.withSuffix = true;
				$rootScope.$digest();
				expect(element.text()).toBe('a few seconds ago');
			});

			it('should ignore non-boolean values', function () {
				$rootScope.testDate = new Date();
				$rootScope.withoutSuffix = 'string';
				var element = angular.element('<span am-time-ago="testDate" am-without-suffix="withoutSuffix"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('a few seconds ago');
			});
		});

		describe('am-format attribute', function () {
			it('should support custom date format', function () {
				var today = new Date();
				$rootScope.testDate = today.getFullYear() + '#' + today.getDate() + '#' + today.getMonth();
				var element = angular.element('<span am-time-ago="testDate" am-format="YYYY#DD#MM"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				expect(element.text()).toBe('a month ago');
			});

			it('should support angular expressions in date format', function () {
				var today = new Date();
				$rootScope.testDate = today.getMonth() + '@' + today.getFullYear() + '@' + today.getDate();
				var element = angular.element('<span am-time-ago="testDate" am-format="{{dateFormat}}"></span>');
				element = $compile(element)($rootScope);
				$rootScope.$digest();
				$rootScope.dateFormat = 'MM@YYYY@DD';
				$rootScope.$digest();
				expect(element.text()).toBe('a month ago');
			});
		});
	});

	describe('amCalendar filter', function () {
		var amCalendar;

		beforeEach(function () {
			amCalendar = $filter('amCalendar');
		});

		it('should convert today date to calendar form', function () {
			var today = new Date();
			var testDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 33, 33);
			expect(amCalendar(testDate)).toBe('Today at 1:33 PM');
		});

		it('should convert date in long past to calendar form', function () {
			expect(amCalendar(new Date(2012, 2, 25, 13, 14, 15))).toBe('03/25/2012');
		});

		it('should gracefully handle undefined values', function () {
			expect(amCalendar()).toBe('');
		});

		it('should accept a numeric unix timestamp (milliseconds since the epoch) as input', function () {
			expect(amCalendar(new Date(2012, 0, 22, 4, 46, 54).getTime())).toBe('01/22/2012');
		});

		it('should respect the configured timezone', function () {
			angularMomentConfig.timezone = 'Pacific/Tahiti';
			expect(amCalendar(Date.UTC(2012, 0, 22, 4, 46, 54))).toBe('01/21/2012');
		});

		it('should apply the "utc" preprocessor when the string "utc" is given in the second argument', function () {
			expect(amCalendar(Date.UTC(2012, 0, 22, 0, 0, 0), 'utc')).toBe('01/22/2012');
			expect(amCalendar(Date.UTC(2012, 0, 22, 23, 59, 59), 'utc')).toBe('01/22/2012');
		});

		it('should apply the "unix" preprocessor if angularMomentConfig.preprocess is set to "unix" and no preprocessor is given', function () {
			angularMomentConfig.preprocess = 'unix';
			expect(amCalendar(100000)).toBe('01/02/1970');
		});

		it('should ignore the default preprocessor if we explicity give it null in the second argument', function () {
			angularMomentConfig.preprocess = 'unix';
			expect(amCalendar(100000, null)).toBe('01/01/1970');
		});

		it('should gracefully handle the case where timezone is given but moment-timezone is not loaded', function () {
			angularMomentConfig.timezone = 'Pacific/Tahiti';
			var originalMomentTz = moment.fn.tz;
			try {
				delete moment.fn.tz;
				expect(amCalendar(Date.UTC(2012, 0, 22, 4, 46, 54))).toBe('01/22/2012');
			} finally {
				moment.fn.tz = originalMomentTz;
			}
		});

		it('should return an empty string for invalid input', function () {
			expect(amCalendar('blah blah')).toBe('');
		});
	});

	describe('amDateFormat filter', function () {
		var amDateFormat;

		beforeEach(function () {
			amDateFormat = $filter('amDateFormat');
		});

		it('should support displaying format', function () {
			var today = new Date();
			var expectedResult = today.getDate() + '.' + (today.getMonth() + 1) + '.' + today.getFullYear();
			expect(amDateFormat(today, 'D.M.YYYY')).toBe(expectedResult);
		});

		it('should gracefully handle undefined values', function () {
			expect(amDateFormat(undefined, 'D.M.YYYY')).toBe('');
		});

		it('should accept a numeric unix timestamp (milliseconds since the epoch) as input', function () {
			var timestamp = new Date(2012, 0, 22, 12, 46, 54).getTime();
			expect(amDateFormat(timestamp, '(HH,mm,ss);MM.DD.YYYY')).toBe('(12,46,54);01.22.2012');
		});

		it('should gracefully handle string unix timestamp as input', function () {
			var strTimestamp = String(new Date(2012, 0, 22, 12, 46, 54).getTime());
			expect(amDateFormat(strTimestamp, '(HH,mm,ss);MM.DD.YYYY')).toBe('(12,46,54);01.22.2012');
		});

		it('should respect the configured timezone', function () {
			angularMomentConfig.timezone = 'Pacific/Tahiti';
			var timestamp = Date.UTC(2012, 0, 22, 12, 46, 54);
			expect(amDateFormat(timestamp, '(HH,mm,ss);MM.DD.YYYY')).toBe('(02,46,54);01.22.2012');
		});

		it('should return an empty string for invalid input', function () {
			expect(amDateFormat('blah blah', '(HH,mm,ss);MM.DD.YYYY')).toBe('');
		});
	});

	describe('amDurationFormat filter', function () {
		var amDurationFormat;

		beforeEach(function () {
			amDurationFormat = $filter('amDurationFormat');
		});

		it('should support return the given duration as text', function () {
			expect(amDurationFormat(1000, 'milliseconds')).toBe('a few seconds');
		});

		it('should support return a day given 24 hours', function () {
			expect(amDurationFormat(24, 'hours')).toBe('a day');
		});

		it('should add prefix the result with the word "in" if the third parameter (suffix) is true', function () {
			expect(amDurationFormat(1, 'minutes', true)).toBe('in a minute');
		});

		it('should add suffix the result with the word "ago" if the duration is negative and the third parameter is true', function () {
			expect(amDurationFormat(-1, 'minutes', true)).toBe('a minute ago');
		});

		it('should gracefully handle undefined values for duration', function () {
			expect(amDurationFormat(undefined, 'minutes')).toBe('');
		});
	});

	describe('amMoment service', function () {
		describe('#changeLanguage', function () {
			it('should return the current language', function () {
				expect(amMoment.changeLanguage()).toBe('en');
			});

			it('should broadcast an angularMoment:languageChange event on the root scope if a language is specified', function () {
				var eventBroadcasted = false;
				$rootScope.$on('amMoment:languageChange', function () {
					eventBroadcasted = true;
				});
				amMoment.changeLanguage('fr');
				expect(eventBroadcasted).toBe(true);
			});

			it('should not broadcast an angularMoment:languageChange event on the root scope if no language is specified', function () {
				var eventBroadcasted = false;
				$rootScope.$on('amMoment:languageChange', function () {
					eventBroadcasted = true;
				});
				amMoment.changeLanguage();
				expect(eventBroadcasted).toBe(false);
			});
		});

		describe('#preprocessDate', function () {
			it('should call a custom preprocessor that was registered on amMoment.preprocessors', function () {
				var testDate = new Date(2013, 0, 22, 12, 46, 54);
				var meeting = {
					name: 'Budget plan',
					date: testDate
				};

				amMoment.preprocessors.foobar = function (value) {
					return moment(value.date);
				};
				
				expect(amMoment.preprocessDate(meeting, 'foobar').valueOf()).toEqual(testDate.getTime());
			});

			it('should issue a warning if an unsupported preprocessor is used and fall-back to default processing', inject(function ($log) {
				var testDate = new Date(2014, 0, 22, 12, 46, 54);
				spyOn($log, 'warn');
				expect(amMoment.preprocessDate(testDate.getTime(), 'blabla').valueOf()).toEqual(testDate.getTime());
				expect($log.warn).toHaveBeenCalledWith('angular-moment: Ignoring unsupported value for preprocess: blabla');
			}));
		});
	});

	describe('amTimeAgoConfig constant', function () {
		it('should generate time with suffix by default', function () {
			expect(amTimeAgoConfig.withoutSuffix).toBe(false);
		});
	});

	describe('angularMomentConfig constant', function () {
		it('should have an empty timezone value by default', function () {
			expect(angularMomentConfig.timezone).toBe('');
		});
		it('should have an empty preprocess value by default', function () {
			expect(angularMomentConfig.preprocess).toBe(null);
		});
	});
});
