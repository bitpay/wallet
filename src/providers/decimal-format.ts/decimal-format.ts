export function decimalFormat(coin:string|number) {
    return Number(coin).toFixed(Math.round(1/Number(coin)).toString().length+1);
}