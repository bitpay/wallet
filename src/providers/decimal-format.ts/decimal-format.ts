export function DecimalFormatBalance(coin:string|number) {
    if (typeof coin === 'string') 
        coin = coin.replace(",","");
    if (Number(coin) == 0) {
        return "0.00"
    } else {
        if (Number(coin) < 10) {
            return Number(Number(coin).toFixed(Math.round(1/Number(coin)).toString().length+2)).toLocaleString("en-GB");
        } else {
            return Number(Number(coin).toFixed(Math.round(1/Number(coin)).toString().length+1)).toLocaleString("en-GB");
        }
    }
}

export function DecimalFormatPrice(coin:string|number) {
    if (typeof coin === 'string') 
        coin = coin.replace(",","");
    if (Number(coin) == 0) {
        return "0.00"
    } else {
        if (Number(coin) < 10) {
            return Number(String(coin).match(RegExp('^-?\\d+(?:\.\\d{0,' + (Math.round(1/+coin).toString().length+2 || 0) + '})?'))).toLocaleString("en-GB");
        } else {
            return Number(String(coin).match(RegExp('^-?\\d+(?:\.\\d{0,' + (Math.round(1/+coin).toString().length+1 || 0) + '})?'))).toLocaleString("en-GB");
        }
    }
}