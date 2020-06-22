export function hexToRGB(h) {
  let r = '0',
    g = '0',
    b = '0';

  // 3 digits
  if (h.length == 4) {
    r = '0x' + h[1] + h[1];
    g = '0x' + h[2] + h[2];
    b = '0x' + h[3] + h[3];

    // 6 digits
  } else if (h.length == 7) {
    r = '0x' + h[1] + h[2];
    g = '0x' + h[3] + h[4];
    b = '0x' + h[5] + h[6];
  }

  return 'rgb(' + +r + ',' + +g + ',' + +b + ')';
}

function getRgbValues(rgbString: string): number[] {
  return rgbString
    .replace('rgb(', '')
    .replace(')', '')
    .split(',')
    .map(stringValue => parseInt(stringValue, 10));
}

export function getBrightness(hexOrRgbString: string): number {
  // http://www.w3.org/TR/AERT#color-contrast
  const rgbString = hexOrRgbString.startsWith('rgb(')
    ? hexOrRgbString
    : hexToRGB(hexOrRgbString);
  const [r, g, b] = getRgbValues(rgbString);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isDark(hexString): boolean {
  const rgbString = hexToRGB(hexString);
  return getBrightness(rgbString) < 80;
}
