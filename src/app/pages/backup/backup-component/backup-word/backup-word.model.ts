export class BackupWordModel {
    public word: string;
    public isBlur: boolean;
    public isCorrect: boolean;

    constructor(data) {
        this.word = data.word || "";
        this.isBlur = data.isBlur || false;
        this.isCorrect = data.isCorrect || false;
    }
}