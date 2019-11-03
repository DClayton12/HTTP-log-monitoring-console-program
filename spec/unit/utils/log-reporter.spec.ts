import { use, expect } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { LogReporter } from '../../../src/utils/log-reporter';
import { MonitoringLog } from '../../../src/utils/log-queue';

use(sinonChai);

describe('LogFileReporter', async () => {
    const mySandbox = sinon.sandbox.create();
    let testReporter: LogReporter;
    
    before(async () => {
        const testThreshold = 10; // 10 requests per second. If more alert
        testReporter = new LogReporter(testThreshold);
    });

    afterEach(() => {
        while(testReporter._alertsQueue.size() > 0){
            testReporter._alertsQueue.dequeue();
        }
        
        mySandbox.reset();
    });

    it('should have public functions accessible', () => {
        expect(testReporter.processLogLine).to.be.ok;
    });

    it('should identify when high traffic seen', async () => {
        for (let i = 0; i < 1500; i++) {                        // Load log events more than threshold. 1440 / 120  is more than 10 reqs per second. 
            let date = new Date( 1549574325000);                // 2019-02-07T21:18:45.000Z
            testReporter._alertsQueue.enqueue({date} as MonitoringLog);
        }

        expect(testReporter._inspectForHighTraffic()).to.eql(true);
    });

    it('should identify when high traffic NOT seen', async () => {
        for (let i = 0; i < 1000; i++) {                        // less than threshold. 1000 / 120 is less than 10 rps.
            let date = new Date( 1549574325000 );                // 2019-02-07T21:18:45.000Z
            testReporter._alertsQueue.enqueue({date} as MonitoringLog);
        }

        expect(testReporter._inspectForHighTraffic()).to.eql(false);
    });
});