export function DecimalFormat(coin:string|number) {
    if (typeof coin === 'string') 
        coin = coin.replace(",","");
    var decimal = Math.round(1/Number(coin)).toString().length+1;
    return Number(coin).toFixed(decimal);
}