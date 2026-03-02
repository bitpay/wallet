import { countries } from 'countries-list';

export interface PhoneCountryCode {
  emoji: string;
  phone: string;
  name: string;
  countryCode: string;
}

export function getPhoneCountryCodes(
  allowedPhoneCountries?: string[]
): PhoneCountryCode[] {
  const countryCodes = Object.keys(countries);
  const countryList = Object.values(countries);
  const countryListWithCodes = countryList
    .map((country, index) => ({
      ...country,
      countryCode: countryCodes[index]
    }))
    .filter(country =>
      allowedPhoneCountries
        ? allowedPhoneCountries.includes(country.countryCode)
        : true
    );
  const countriesWithMultiplePhoneCodes = countryListWithCodes
    .filter(country => country.phone.includes(','))
    .map(country => {
      const codes = country.phone.split(',');
      return codes.map(code => ({ ...country, phone: code }));
    });
  const countriesWithSinglePhoneCode = countryListWithCodes.filter(
    country => !country.phone.includes(',')
  );
  const multiplePhoneCodesFlattened = [].concat.apply(
    [],
    countriesWithMultiplePhoneCodes
  );
  return countriesWithSinglePhoneCode
    .concat(multiplePhoneCodesFlattened)
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}
