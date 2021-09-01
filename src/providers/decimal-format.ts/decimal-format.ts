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