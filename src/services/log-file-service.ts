import * as fs from 'fs';

export class LogFileReader {
    private _filePath: string;
    private _fileStream: any;

    public constructor(filePath: string) {
        this._filePath = filePath;
        this._fileStream = fs.createReadStream(this._filePath, {flags: 'r'});
    }

    public getInstance(): any {
        if(!this._fileStream){
            console.error('File stream never initialized');
        }
        return this._fileStream;
    }

    public static createFileReader(filePath: string): LogFileReader {
        return new LogFileReader(
            filePath
        );
      }
}