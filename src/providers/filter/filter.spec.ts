import { TestUtils } from '../../test';
import { FilterProvider } from './filter';

describe('Provider: Filter Provider', () => {
  let filterProvider: FilterProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    filterProvider = testBed.get(FilterProvider);
  });

  describe('Function: formatFiatAmount', () => {
    it('should return 0 if not has value', () => {
      let amount;
      expect(filterProvider.formatFiatAmount(amount)).toEqual(0);
    });
    it('should return 0 if it is a negative value', () => {
      let amount = -1;
      expect(filterProvider.formatFiatAmount(amount)).toEqual(0);
    });
    it('should return the value with 2 decimals if it does not have decimal values', () => {
      let amount = 1;
      expect(filterProvider.formatFiatAmount(amount)).toEqual('1.00');
    });
    it('should return the value with two numbers after the decimal point if the value has more or less than 2 numbers after the decimal point', () => {
      let amount1 = 1.223123123;
      expect(filterProvider.formatFiatAmount(amount1)).toEqual('1.22');
      let amount2 = 1.2;
      expect(filterProvider.formatFiatAmount(amount2)).toEqual('1.20');
    });
    it('should  return the formatted value if the value is greater than 999', () => {
      let amount = 1000000000.2;
      expect(filterProvider.formatFiatAmount(amount)).toEqual(
        '1,000,000,000.20'
      );
    });
    it('should return the formatted value if the value is greater than 999 and has no numbers after the decimal point', () => {
      let amount = 1000000000;
      expect(filterProvider.formatFiatAmount(amount)).toEqual('1,000,000,000');
    });
  });
});
