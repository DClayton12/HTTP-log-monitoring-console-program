"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_queue_1 = require("./log-queue");
class LogReporter {
    constructor(trafficThreshold) {
        this._totalNumberLogsProcessed = 0; // Historical output of job
        this._isHighTrafficAlerted = false; // Maintains state of alert versus recovery status.
        this._statisticTimeToLive = 10; // TTL
        this._alertTimeToLive = 120; // TTL
        this._trafficThreshold = trafficThreshold;
        this._statsQueue = new log_queue_1.LogQueue();
        this._alertsQueue = new log_queue_1.LogQueue();
    }
    processLogLine(logLine) {
        if (this._howManyLogsProcessed() === 0) {
            return this._increaseNumberLogsProcessed();
        } //No-Op for header of file. 
        const logDetails = this._transformLogLine(logLine);
        if (!logDetails) {
            return;
        }
        if (this._doesEventExceedTtl(logDetails.date, this._tenSecondIntervalTracker, this._statisticTimeToLive)) { // Trigger stat report to STDOUT
            this._reportTenSecondStatistics();
        }
        this._setIntervalTimers(logDetails.date, this._tenSecondIntervalTracker, this._statisticTimeToLive, this._twoMinuteIntervalTracker, this._alertTimeToLive); // O(1) If more than 10s, Update timer to do time diff and eviction computation
        this._evictOldEvents(this._statsQueue, this._tenSecondIntervalTracker, this._statisticTimeToLive); // Evict logs for STATISTICS older than 10 SECS. O(N) N=# of logs within 10s held in queue.   
        this._evictOldEvents(this._alertsQueue, this._twoMinuteIntervalTracker, this._alertTimeToLive);
        this._statsQueue.enqueue(logDetails); // Add Recent event to queue O(1)
        this._alertsQueue.enqueue(logDetails);
        this._alertIfNecessary(logDetails.date);
        return this._increaseNumberLogsProcessed();
    }
    _alertIfNecessary(timeOfLogNow) {
        if (this._inspectForHighTraffic()) { // High Traffic Seen Within 2 minutes
            if (this._isHighTrafficAlerted === false) { //  `_isHighTrafficAlerted` = true if alert thrown already
                this._alertForHighTraffic(timeOfLogNow);
                this._timeOfLastHighTrafficAlert = timeOfLogNow;
                this._isHighTrafficAlerted = true;
            }
        }
        else {
            if (this._isHighTrafficAlerted === true) { // High Traffic no longer seen, toggle bool and report decrese in 2minute-traffic
                this._isHighTrafficAlerted = false;
                this._reportNormalTraffic(timeOfLogNow);
            }
        }
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
    _doesEventExceedTtl(timeOfLogNow, interval, timeToLive) {
        if (!timeOfLogNow) { // LogQueue will return null it is empty, (No logs, or only header processed)
            return false;
        }
        if (this._howManyLogsProcessed() === 1) { // Init timers on first log-event processed
            this._tenSecondIntervalTracker = timeOfLogNow;
            this._twoMinuteIntervalTracker = timeOfLogNow;
            return false;
        }
        return ((timeOfLogNow.getTime() - interval.getTime())
            / 1000 >= timeToLive ?
            true : false);
    }
    _setIntervalTimers(timeOfLogNow, statInterval, statTimeToLive, alertInterval, alertTimeToLive) {
        if (this._doesEventExceedTtl(timeOfLogNow, statInterval, statTimeToLive)) { // Set 10 second interval timer
            this._tenSecondIntervalTracker = timeOfLogNow;
        }
        if (this._doesEventExceedTtl(timeOfLogNow, alertInterval, alertTimeToLive)) { // Set 2 minute interval timer
            this._twoMinuteIntervalTracker = timeOfLogNow;
        }
        return;
    }
    _evictOldEvents(logQueue, interval, timeToLive) {
        while (this._doesEventExceedTtl(interval, logQueue.peekDate(), timeToLive)) {
            this._dequeueEvent(logQueue);
        }
    }
    _dequeueEvent(logQueue) {
        return logQueue.dequeue();
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLXJlcG9ydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2xvZy1yZXBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUFzRDtBQUV0RCxNQUFhLFdBQVc7SUFjcEIsWUFBWSxnQkFBd0I7UUFiNUIsOEJBQXlCLEdBQVcsQ0FBQyxDQUFDLENBQUUsMkJBQTJCO1FBRW5FLDBCQUFxQixHQUFZLEtBQUssQ0FBQyxDQUFDLG1EQUFtRDtRQUkzRix5QkFBb0IsR0FBWSxFQUFFLENBQUMsQ0FBQyxNQUFNO1FBSTFDLHFCQUFnQixHQUFZLEdBQUcsQ0FBQyxDQUFDLE1BQU07UUFJM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxvQkFBUSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLG9CQUFRLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRU0sY0FBYyxDQUFDLE9BQWU7UUFDakMsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1NBQUUsQ0FBQyw0QkFBNEI7UUFFcEgsTUFBTSxVQUFVLEdBQXlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RSxJQUFHLENBQUMsVUFBVSxFQUFFO1lBQUMsT0FBTTtTQUFDO1FBQ3hCLElBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFDLEVBQUksZ0NBQWdDO1lBQ3hJLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1NBQ3JDO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFB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