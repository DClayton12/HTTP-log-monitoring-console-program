export interface MonitoringLog {
    remoteHost: string;
    rfc931: string;
    authUser: string;
    date: Date;
    requestRoute: string;
    status: string;
    bytes: string;
    section: string;
}

export class LogQueue {
    private _q: Array<MonitoringLog> = [];

    constructor (){}

    public size(): number {
        return this._q.length;
    }

    public dequeue(): void {
        this._q.shift();   // O(N) operation because underlying structure is an Array, N=# elements in Queue, must shift index.
        return;            // May be improved by using linked list, poping from front will be O(1) operartion   
    }

    public enqueue(element: MonitoringLog): void {
        this._q.push(element);
        return;
    }

    public peek(): MonitoringLog | null {
        if(this._q.length === 0){
            return null;
        }
        return this._q[0];
    }

    public peekDate(): Date | null{
        if(this._q.length === 0){
            return null;
        }
        return this._q[0].date;
    }

    public getContents(): Array<MonitoringLog> {
        return this._q;
    }
}