export class RecipientModel {
    public toAddress: string;
    public amount: number;
    public amountToShow: string;
    public altAmountStr: string;
    public isValid?: boolean;
    public id?: number = Date.now();
    public name?:string;
    public recipientType: string;
    public currency?: string;
    constructor(data) {
        this.id = Date.now();
        this.toAddress = data.toAddress || "";
        this.amount = data.amount || 0;
        this.amountToShow = data.amountToShow || "";
        this.isValid = data.isValid || false;
        this.altAmountStr = data.altAmountStr || "";
        this.name = data.name || "";
        this.recipientType = data.recipientType || "";
        this.currency = data.currency || "";
    }
} 