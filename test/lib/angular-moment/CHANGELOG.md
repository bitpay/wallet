# Changelog

## 0.7.1 - 2014-05-16
- bugfix: Preprocess set in configuration not used by filters ([#49](https://github.com/urish/angular-moment/issues/49))

## 0.7.0 - 2014-04-19
- Use `moment` as an injectable constant instead of relying on `$window.moment` ([#35](https://github.com/urish/angular-moment/pull/35), contributed by [just-boris](https://github.com/just-boris))
- Require.js support ([#36](https://github.com/urish/angular-moment/issues/36))
- Add am-preprocess attribute to support unix and utc timestamps ([#38](https://github.com/urish/angular-moment/pull/38), contributed by [jspaper](https://github.com/jspaper))
- NGDoc documentation ([#40](https://github.com/urish/angular-moment/issues/40))
- Enable support for AngularJS 1.3.x in bower.json
- Support moment.js v2.6.0. See [here](https://gist.github.com/ichernev/10544682) for changelog.

## 0.6.2 - 2014-02-05
- Add `amMoment` service with a `changeLanguage()` method ([#32](https://github.com/urish/angular-moment/pull/32), contributed by [Ornthalas](https://github.com/Ornthalas))
- bower.json: Move `moment-timezone` to devDependencies (fixes [#34](https://github.com/urish/angular-moment/issues/34))

## 0.6.1 - 2014-01-31
- Add optional timezone support to `amCalendar` and `amDateFormat` filters ([#27](https://github.com/urish/angular-moment/pull/27), contributed by [kayhadrin](https://github.com/kayhadrin))
- Happy Year of the Horse!

## 0.6.0 - 2013-12-24

- Add optional `am-without-suffix` attribute to `am-time-ago` ([#22](https://github.com/urish/angular-moment/issues/22), contributed by [hramaker](https://github.com/hramaker))
- Support moment.js v2.5.0. See [here](https://gist.github.com/ichernev/8104451) for changelog.
- Merry Christmas!

## 0.5.2 - 2013-11-17

- Add `amCalendar` filter ([#24](https://github.com/urish/angular-moment/issues/24), contributed by [OndraM](https://github.com/OndraM))

## 0.5.1 - 2013-11-09

- Add `amDuration` filter ([#20](https://github.com/urish/angular-moment/issues/20), contributed by [gabrielstuff](https://github.com/gabrielstuff))

## 0.5.0 - 2013-11-02

- Use $window.setTimeout instead of $timeout, fixes protractor synchronization issue ([#19](https://github.com/urish/angular-moment/issues/19))

## 0.4.2 - 2013-10-30

- Add settings constant for configuring moment.js withoutSuffix-option ([#18](https://github.com/urish/angular-moment/pull/18))

## 0.4.1 - 2013-10-27

- Support moment.js v2.4.0. See [here](https://github.com/moment/moment/#240) for changelog.

## 0.4.0 - 2013-10-08

- Support moment.js v2.3.0. See [here](https://gist.github.com/ichernev/6864354) for possibly breaking changes.

## 0.3.0 - 2013-10-07

- Bugfix: `am-time-ago` support for empty string ([#15](https://github.com/urish/angular-moment/issues/15))
- Behavior change: `am-time-ago` will only change the text once there is date

## 0.2.2 - 2013-09-29

- Add support for passing unix timestamp as a string to `amDateFormat` filter ([#14](https://github.com/urish/angular-moment/issues/14))

## 0.2.1 - 2013-09-13

- Fix an issue with tests failing on a different timezone
- Support moment 2.2.x, AngularJS 1.2

## 0.2.0 - 2013-08-22

- Add optional `am-format` attribute to `am-time-ago` ([#11](https://github.com/urish/angular-moment/issues/11))
- Add new `amDateFormat` filter ([#12](https://github.com/urish/angular-moment/issues/12))
- Add changelog file

## 0.1.1 - 2013-06-08

- Fix to support iOS ([#2](https://github.com/urish/angular-moment/pull/2), contributed by [giuseppeaiello](https://github.com/giuseppeaiello))

## 0.1.0 - 2013-05-27

- Initial release