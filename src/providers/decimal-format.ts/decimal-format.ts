export function DecimalFormat(coin:string|number) {
    var decimal = Math.round(1/Number(coin)).toString().length+1;
    return Number(coin).toFixed(decimal);
}