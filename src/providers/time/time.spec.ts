import { TimeProvider } from './time';

describe('TimeProvider', () => {
  const timeProvider = new TimeProvider();
  describe('getMonthYear', () => {
    it('should concatenate the month and year into a string', () => {
      const monthYear = timeProvider.getMonthYear(new Date('Jan 1, 2020'));
      expect(monthYear).toBe('0-2020');
    });
    it('should distinguish between dates whose month and year sum to the same value', () => {
      const date1 = new Date('Jan 1, 2020'); // month 0, year 2020, sum 2020
      const date2 = new Date('Feb 1, 2019'); // month 1, year 2019, sum 2020
      const monthYear1 = timeProvider.getMonthYear(date1);
      const monthYear2 = timeProvider.getMonthYear(date2);
      expect(monthYear1).not.toEqual(monthYear2);
    });
  });
});
