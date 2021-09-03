export function DecimalFormatBalance(balance:any) {
    if (typeof balance === 'string') 
        balance = balance.replace(",","");
    if (isNaN(Number(balance)) || Number(balance) <= 0) {
        return "0.00";
    } else {
        if (Number(balance) < 10) {
            return Number(Number(balance).toFixed(Math.round(1/Number(balance)).toString().length+2)).toLocaleString("en-GB");
        } else {
            return Number(Number(balance).toFixed(Math.round(1/Number(balance)).toString().length+1)).toLocaleString("en-GB");
        }
    }
}
