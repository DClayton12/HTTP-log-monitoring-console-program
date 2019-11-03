import { LogQueue, MonitoringLog } from "./log-queue";

export class LogReporter {
    private _totalNumberLogsProcessed: number = 0;  // Historical output of job
    private _trafficThreshold: number;              // Average threshold of traffic to alert on
    private _isHighTrafficAlerted: boolean = false; // Maintains state of alert versus recovery status.
    private _timeOfLastHighTrafficAlert: Date;      // Time of most recent high traffic alert. Use for alert-recovery reporting

    private _tenSecondIntervalTracker: Date; // Updates in increments of 10 seconds
    private _statisticTimeToLive: number  = 10; // TTL
    private _statsQueue: LogQueue;

    private _twoMinuteIntervalTracker: Date; // Updates in increments of 120 seconds
    private _alertTimeToLive: number  = 120; // TTL
    public _alertsQueue: LogQueue;

    constructor(trafficThreshold: number){
        this._trafficThreshold = trafficThreshold;
        this._statsQueue = new LogQueue();
        this._alertsQueue = new LogQueue();
    }

    public processLogLine(logLine: string): void {
        if( this._howManyLogsProcessed() === 0 ){ return this._increaseNumberLogsProcessed(); } //No-Op for header of file. 
        
        const logDetails: MonitoringLog | null = this._transformLogLine(logLine);
        if(!logDetails) {return}
        if(this._doesEventExceedTtl(logDetails.date, this._tenSecondIntervalTracker, this._statisticTimeToLive)){   // Trigger stat report to STDOUT
            this._reportTenSecondStatistics();
        }

        this._setIntervalTimers(logDetails.date, this._tenSecondIntervalTracker, this._statisticTimeToLive, this._twoMinuteIntervalTracker, this._alertTimeToLive); // O(1) If more than 10s, Update timer to do time diff and eviction computation

        this._evictOldEvents(this._statsQueue, this._tenSecondIntervalTracker, this._statisticTimeToLive); // Evict logs for STATISTICS older than 10 SECS. O(N) N=# of logs within 10s held in queue.   
        this._evictOldEvents(this._alertsQueue, this._twoMinuteIntervalTracker, this._alertTimeToLive);
        
        this._statsQueue.enqueue(logDetails);       // Add Recent event to queue O(1)
        this._alertsQueue.enqueue(logDetails);

        this._alertIfNecessary(logDetails.date);
      
        return this._increaseNumberLogsProcessed();
    }

    private _alertIfNecessary(timeOfLogNow: Date): void {
        if(this._inspectForHighTraffic()){ // High Traffic Seen Within 2 minutes
            if(this._isHighTrafficAlerted === false) {   //  `_isHighTrafficAlerted` = true if alert thrown already
                this._alertForHighTraffic(timeOfLogNow);
                this._timeOfLastHighTrafficAlert = timeOfLogNow;
                this._isHighTrafficAlerted = true;
            }
        } else {
            if(this._isHighTrafficAlerted === true){ // High Traffic no longer seen, toggle bool and report decrese in 2minute-traffic
                this._isHighTrafficAlerted = false;
                this._reportNormalTraffic(timeOfLogNow);
            }
        }
    }

    private _reportNormalTraffic(timeAlertRecovered: Date): void {
        const requestAverage: number = this._alertsQueue.size() / this._alertTimeToLive;   // Calculate average for 2 minutes of traffic
        const secondsSinceLastAlert: number = Math.abs( 
                                                timeAlertRecovered.getTime() - this._timeOfLastHighTrafficAlert.getTime()
                                              )
                                              / 1000;
        console.log(`Alert recovered at ${timeAlertRecovered}, ${secondsSinceLastAlert} seconds since last alert. ${Math.round(requestAverage)} requets per second is less than threshold of ${this._trafficThreshold}. `);
        return;
    }

    private _alertForHighTraffic(timeOfAlert: Date){
        console.log(`High traffic generated an alert - hits = ${this._alertsQueue.size()}, triggered at ${timeOfAlert}`);
    }

    public _inspectForHighTraffic(){
        const requestAverage: number = this._alertsQueue.size() / this._alertTimeToLive;   // Calculate average for 2 minutes of traffic
        return (requestAverage >= this._trafficThreshold ? true : false);
    }

    private _reportTenSecondStatistics(): void {
        const logsForStats: Array<MonitoringLog> = this._statsQueue.getContents();
        const stats: any = {};                                          // TODO add strong typing for statistic
        
        for(let logStat of logsForStats ) {
            if(stats[logStat.section]){
                stats[logStat.section].numberReqs++;
                stats[logStat.section].reqRoutes.add(logStat.requestRoute);
                stats[logStat.section].uniqueRoutesHit.add(logStat.requestRoute);
                stats[logStat.section].uniqueStatusCodes.add(logStat.status);
                stats[logStat.section].uniqueHosts.add(logStat.remoteHost);
                stats[logStat.section].uniqueUsers.add(logStat.authUser);
            } else {
                stats[logStat.section] = {
                                            numberReqs: 1,
                                            reqRoutes: new Set().add(logStat.requestRoute),
                                            uniqueRoutesHit: new Set().add(logStat.requestRoute),
                                            uniqueStatusCodes: new Set().add(logStat.status),
                                            uniqueHosts: new Set().add(logStat.remoteHost),
                                            uniqueUsers: new Set().add(logStat.authUser)                                
                                        }
            }

            
        }

        const sortedStatKeys = this._sortStats(stats);

        console.log(':::: REPORTING STATS TOP-5 VISITED SECTIONS FOR LAST 10 SECONDS ::::');
        for (let i = 0; i < 5 && i < sortedStatKeys.length; i++){      // Report Statistics on TOP 3 sections only in 10 seconds
            console.log(`
                        LOG_SECTION: ${sortedStatKeys[i]}, 
                        STATUS_CODES: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueStatusCodes']))},
                        ROUTES: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueRoutesHit']))}, 
                        HOSTS: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueHosts']))},
                        USERS: ${JSON.stringify(this._getSetValues(stats[sortedStatKeys[i]]['uniqueUsers']))}`
                    );
        }

        return;
    }

    private _getSetValues(statSet: any): any {
        return Array.from(statSet)
    }

    private _sortStats(stats: any) {
        return Object.keys(stats).sort((a,b) => {
            return (stats[a]['numberReqs'] >= stats[b]['numberReqs'] ? stats[a] : stats[b]);
        });
    }

    private _doesEventExceedTtl(timeOfLogNow: Date | null, interval: Date, timeToLive: number): boolean {
        if(!timeOfLogNow){                          // LogQueue will return null it is empty, (No logs, or only header processed)
            return false;
        }
        if(this._howManyLogsProcessed() === 1){     // Init timers on first log-event processed
            this._tenSecondIntervalTracker = timeOfLogNow;
            this._twoMinuteIntervalTracker = timeOfLogNow;
            return false;
        }
        return ( 
                      (  timeOfLogNow.getTime() - interval.getTime() )
                     
                    / 1000 >= timeToLive ?
                        true : false
                );
    }

    private _setIntervalTimers(timeOfLogNow: Date, statInterval: Date, statTimeToLive: number, alertInterval: Date, alertTimeToLive: number): void {
        if(this._doesEventExceedTtl(timeOfLogNow, statInterval, statTimeToLive)){    // Set 10 second interval timer
            this._tenSecondIntervalTracker = timeOfLogNow;
        }
        if(this._doesEventExceedTtl(timeOfLogNow, alertInterval, alertTimeToLive)){  // Set 2 minute interval timer
            this._twoMinuteIntervalTracker = timeOfLogNow;
        }
        return;
    }

    private _evictOldEvents(logQueue: LogQueue, interval: Date, timeToLive: number): void {
        while(
            this._doesEventExceedTtl(
                interval,
                logQueue.peekDate() as Date,
                timeToLive
            )
        ){
            this._dequeueEvent(logQueue);
        }        
    }

    private _dequeueEvent(logQueue: LogQueue): void {
        return logQueue.dequeue();
    }

    private _howManyLogsProcessed(): number {
        return this._totalNumberLogsProcessed;
    }

    private _increaseNumberLogsProcessed(): void {
        this._totalNumberLogsProcessed++;
        return;
    }

    private _transformLogLine(logLine: string): MonitoringLog | null {
        if(!logLine){
            return null;
        }
        const logLineInfo = logLine.split(',');

        try {
            const remoteHost = logLineInfo[0];
            const rfc931 = logLineInfo[1];
            const authUser = logLineInfo[2];
            const date = new Date( 
                parseInt(logLineInfo[3]) * 1000
            );
            const requestRoute = logLineInfo[4];
            const status = logLineInfo[5];
            const bytes = logLineInfo[6];
            
            const resourceInfo = requestRoute.split('/');
            const section = `/${resourceInfo[1]}`;
            
            return { remoteHost, rfc931, authUser, date, requestRoute, status, bytes, section };
        } catch(err){
            throw `Failed to process log-line. ERROR=${err} LINE=${logLine}`;
        }
    }
}