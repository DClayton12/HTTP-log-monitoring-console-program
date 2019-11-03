import { use, expect } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as es from 'event-stream';
import { LogFileReader } from '../../../src/services/log-file-service';

use(sinonChai);

describe('LogFileReader', async () => {
    const mySandbox = sinon.sandbox.create();
    let txtTestLogFileReader: LogFileReader;
    let csvTestLogFileReader: LogFileReader;
    
    before(async () => {
        txtTestLogFileReader = LogFileReader.createFileReader('./spec/unit/services/mock_data_file.txt');
        csvTestLogFileReader = LogFileReader.createFileReader('./spec/unit/services/test_file.csv');
    });

    afterEach(() => {
        mySandbox.reset();
    });

    it('should have public functions accessible', () => {
        expect(txtTestLogFileReader.getInstance).to.be.ok;
        expect(csvTestLogFileReader.getInstance).to.be.ok;
    });

    it('should read from TXT file', async () => {
        const logLines: Array<any> = [];

        csvTestLogFileReader
            .getInstance()
            .pipe(es.split())
            .pipe(es.mapSync(
                (line: string) => {
                    logLines.push(line);
                }
            ));

        await sleep(5); // Must stream file.
        expect(logLines.length).to.eql(3);
        expect(logLines).to.include('one,two,three');
        expect(logLines).to.include('test,test,testing');
    });

    it('should read from CSV file', async () => {
        const logLines: Array<any> = [];

        txtTestLogFileReader
            .getInstance()
            .pipe(es.split())
            .pipe(es.mapSync(
                (line: string) => {
                    logLines.push(line);
                }
            ));

        await sleep(5); // Must stream file.

        expect(logLines.length).to.eql(10);

        expect(logLines).to.include('remotehost,rfc931,authuser,date,request,status,bytes'),
        expect(logLines).to.include('10.0.0.2,-,apache,1549573860,GET /api/user HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.4,-,apache,1549573860,GET /api/user HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.4,-,apache,1549573860,GET /api/user HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.2,-,apache,1549573860,GET /api/help HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.5,-,apache,1549573860,GET /api/help HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.4,-,apache,1549573859,GET /api/help HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.5,-,apache,1549573860,POST /report HTTP/1.0,500,1307'),
        expect(logLines).to.include('10.0.0.3,-,apache,1549573860,POST /report HTTP/1.0,200,1234'),
        expect(logLines).to.include('10.0.0.3,-,apache,1549573860,GET /report HTTP/1.0,200,1194');
    });

    function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
      }
});