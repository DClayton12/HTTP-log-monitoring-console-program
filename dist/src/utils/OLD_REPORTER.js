"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_queue_1 = require("./log-queue");
// interface Statistics {
// }
// interface LogStatistic {
//     apiSection: string;
//     numberTimesHostSeen: number;
// }
class LogReporter {
    // private _fileHeader: string;
    // private _timeNow: Date;
    // private _trafficThreshold: number;
    // private _processedLogs: Array<MonitoringLog>
    // constructor(trafficThreshold: number){
    constructor(trafficThreshold) {
        this._totalNumberLogsProcessed = 0; // Historical output of job
        this._isHighTrafficAlerted = false;
        this._statisticTimeToLive = 10;
        this._alertTimeToLive = 120;
        this._trafficThreshold = trafficThreshold;
        this._statsQueue = new log_queue_1.LogQueue();
        this._alertsQueue = new log_queue_1.LogQueue();
    }
    async processLogLine(logLine) {
        console.log('::::this._trafficThreshold', this._trafficThreshold);
        if (this._howManyLogsProcessed() === 0) { //No-Op for header of file.
            this._increaseNumberLogsProcessed();
            return;
        }
        const logDetails = this._transformLogLine(logLine);
        if (!logDetails) {
            return;
        }
        if (this._doesStatExceedTtlThreshold(logDetails.date)) { // Trigger stat report to STDOUT
            // this._reportTenSecondStatistics();
            this._reportTenSecondStatistics;
        }
        this._setStatTimer(logDetails.date); // O(1) If more than 10s, Update timer to do time diff and eviction computation
        this._setAlertTimer(logDetails.date);
        console.log('::::: ::::::::');
        console.log('::::: BEFORE', this._alertsQueue.size());
        await this._evictOldStats(); // Evict logs for STATISTICS older than 10 SECS. O(N) N=# of logs within 10s held in queue. 
        await this._evictOldAlerts();
        console.log('::::: after', this._alertsQueue.size());
        console.log('::::: ::::::::');
        this._addLogForReporting(logDetails, this._statsQueue); // Add Recent log to queue O(1)
        this._addLogForReporting(logDetails, this._alertsQueue);
        console.log('::::::  ????  ::::::', this._inspectForHighTraffic());
        if (this._inspectForHighTraffic()) { // High Traffic Seen Within 2 minutes
            console.log('::::::  High traffic  ::::::', this._isHighTrafficAlerted);
            if (this._isHighTrafficAlerted === false) { //  `_isHighTrafficAlerted` = true if alert thrown already
                this._alertForHighTraffic(logDetails.date);
                this._timeOfLastHighTrafficAlert = logDetails.date;
                this._isHighTrafficAlerted = true;
            }
        }
        else {
            console.log('::::::  CHILLL  ::::::', this._isHighTrafficAlerted);
            if (this._isHighTrafficAlerted === true) { // High Traffic no longer seen, toggle bool and report decrese in 2minute-traffic
                this._isHighTrafficAlerted = false;
                this._reportNormalTraffic(logDetails.date);
            }
        }
        return;
    }
    _reportNormalTraffic(timeAlertRecovered) {
        const requestAverage = this._alertsQueue.size() / this._alertTimeToLive; // Calculate average for 2 minutes of traffic
        const secondsSinceLastAlert = Math.abs(timeAlertRecovered.getTime() - this._timeOfLastHighTrafficAlert.getTime())
            / 1000;
        console.log(`Alert recovered at ${timeAlertRecovered}, ${secondsSinceLastAlert} seconds since last alert. ${Math.round(requestAverage)} requets per second is less than threshold of ${this._trafficThreshold}. `);
        return;
    }
    _alertForHighTraffic(timeOfAlert) {
        console.log(`High traffic generated an alert - hits = ${this._alertsQueue.size()}, triggered at ${timeOfAlert}`);
    }
    _inspectForHighTraffic() {
        const requestAverage = this._alertsQueue.size() / this._alertTimeToLive; // Calculate average for 2 minutes of traffic
        return (requestAverage >= this._trafficThreshold ? true : false);
    }
    _reportTenSecondStatistics() {
        const logsForStats = this._statsQueue.getContents();
        const stats = {}; // TODO add strong typing for statistic
        for (let logStat of logsForStats) {
            if (stats[logStat.section]) {
                stats[logStat.section].numberReqs++;
                stats[logStat.section].reqRoutes.add(logStat.requestRoute);
                stats[logStat.section].uniqueRoutesHit.add(logStat.requestRoute);
                stats[logStat.section].uniqueStatusCodes.add(logStat.status);
                stats[logStat.section].uniqueHosts.add(logStat.remoteHost);
                stats[logStat.section].uniqueUsers.add(logStat.authUser);
            }
            else {
                stats[logStat.section] = {
                    numberReqs: 1,
                    reqRoutes: new Set().add(logStat.requestRoute),
                    uniqueRoutesHit: new Set().add(logStat.requestRoute),
                    uniqueStatusCodes: new Set().add(logStat.status),
                    uniqueHosts: new Set().add(logStat.remoteHost),
                    uniqueUsers: new Set().add(logStat.authUser)
                };
            }
        }
        const sortedStatKeys = this._sortStats(stats);
        console.log(':::: REPORTING STATS TOP-5 VISITED SECTIONS FOR LAST 10 SECONDS ::::');
        for (let i = 0; i < 5 && i < sortedStatKeys.length; i++) { // Report Statistics on TOP 3 sections only in 10 seconds
            console.log(`
                        LOG_SECTION: ${sortedStatKeys[i]}, 
                        STATUS_CODES: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueStatusCodes']))},
                        ROUTES: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueRoutesHit']))}, 
                        HOSTS: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueHosts']))},
                        USERS: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueUsers']))}`);
        }
        return;
    }
    _getSetValues(statSet) {
        return Array.from(statSet);
    }
    _sortStats(stats) {
        return Object.keys(stats).sort((a, b) => {
            return (stats[a]['numberReqs'] >= stats[b]['numberReqs'] ? stats[a] : stats[b]);
        });
    }
    _doesStatExceedTtlThreshold(timeOfLogNow) {
        if (!timeOfLogNow) { // LogQueue will return null it is empty, (No logs, or only header processed)
            return false;
        }
        if (!this._tenSecondIntervalTracker) {
            this._tenSecondIntervalTracker = timeOfLogNow;
            return false;
        }
        return (Math.abs(timeOfLogNow.getTime() - this._tenSecondIntervalTracker.getTime())
            / 1000 >= this._statisticTimeToLive ?
            true : false);
    }
    _doesAlertExceedTtlThreshold(timeOfLogNow) {
        if (!timeOfLogNow) { // LogQueue will return null it is empty, (No logs, or only header processed)
            return false;
        }
        if (!this._twoMinuteIntervalTracker) {
            this._twoMinuteIntervalTracker = timeOfLogNow;
            return false;
        }
        return (Math.abs(timeOfLogNow.getTime() - this._twoMinuteIntervalTracker.getTime())
            / 1000 >= this._alertTimeToLive ?
            true : false);
    }
    _addLogForReporting(logDetails, logQueue) {
        logQueue.enqueue(logDetails);
    }
    _setStatTimer(timeOfLogNow) {
        if (this._doesStatExceedTtlThreshold(timeOfLogNow)) {
            this._tenSecondIntervalTracker = timeOfLogNow;
        }
        return;
    }
    _setAlertTimer(timeOfLogNow) {
        if (this._doesAlertExceedTtlThreshold(timeOfLogNow)) {
            this._twoMinuteIntervalTracker = timeOfLogNow;
        }
        return;
    }
    async _evictOldStats() {
        while (this._doesStatExceedTtlThreshold(this._statsQueue.peekDate())) {
            await this._dequeueStatistic();
        }
    }
    async _evictOldAlerts() {
        while (this._doesAlertExceedTtlThreshold(this._alertsQueue.peekDate())) {
            await this._dequeueAlert();
        }
    }
    async _dequeueStatistic() {
        return this._statsQueue.dequeue();
    }
    async _dequeueAlert() {
        return this._alertsQueue.dequeue();
    }
    // private _getOldestLogTime(): Date {
    //     const oldestLog = this._peekLogQueue();
    //     return oldestLog.date;
    // }
    // private _peekLogQueue(): MonitoringLog {
    //     return this._logsStatsTenSecondQueue[0];
    // } 
    _howManyLogsProcessed() {
        return this._totalNumberLogsProcessed;
    }
    _increaseNumberLogsProcessed() {
        this._totalNumberLogsProcessed++;
        return;
    }
    _transformLogLine(logLine) {
        if (!logLine) {
            return null;
        }
        const logLineInfo = logLine.split(',');
        try {
            const remoteHost = logLineInfo[0];
            const rfc931 = logLineInfo[1];
            const authUser = logLineInfo[2];
            const date = new Date(parseInt(logLineInfo[3]) * 1000);
            const requestRoute = logLineInfo[4];
            const status = logLineInfo[5];
            const bytes = logLineInfo[6];
            const resourceInfo = requestRoute.split('/');
            const section = `/${resourceInfo[1]}`;
            return { remoteHost, rfc931, authUser, date, requestRoute, status, bytes, section };
        }
        catch (err) {
            throw `Failed to process log-line. ERROR=${err} LINE=${logLine}`;
        }
    }
}
exports.LogReporter = LogReporter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT0xEX1JFUE9SVEVSLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL09MRF9SRVBPUlRFUi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUFzRDtBQUt0RCx5QkFBeUI7QUFFekIsSUFBSTtBQUNKLDJCQUEyQjtBQUMzQiwwQkFBMEI7QUFDMUIsbUNBQW1DO0FBQ25DLElBQUk7QUFFSixNQUFhLFdBQVc7SUFjcEIsK0JBQStCO0lBQy9CLDBCQUEwQjtJQUMxQixxQ0FBcUM7SUFDckMsK0NBQStDO0lBRS9DLHlDQUF5QztJQUN6QyxZQUFZLGdCQUF3QjtRQW5CNUIsOEJBQXlCLEdBQVcsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1FBRWxFLDBCQUFxQixHQUFZLEtBQUssQ0FBQztRQUl2Qyx5QkFBb0IsR0FBWSxFQUFFLENBQUM7UUFJbkMscUJBQWdCLEdBQVksR0FBRyxDQUFDO1FBVXBDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztRQUMxQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksb0JBQVEsRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxvQkFBUSxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUdNLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBZTtRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xFLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsMkJBQTJCO1lBQ2pFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1lBQ3BDLE9BQU87U0FDVjtRQUVELE1BQU0sVUFBVSxHQUNaLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQyxJQUFHLENBQUMsVUFBVSxFQUFFO1lBQUMsT0FBTTtTQUFDO1FBQ3hCLElBQUcsSUFBSSxD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