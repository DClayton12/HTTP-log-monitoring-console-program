"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LogQueue {
    constructor() {
        this._q = [];
    }
    size() {
        return this._q.length;
    }
    dequeue() {
        this._q.shift(); // O(N) operation because underlying structure is an Array, N=# elements in Queue, must shift index.
        return; // May be improved by using linked list, poping from front will be O(1) operartion   
    }
    enqueue(element) {
        this._q.push(element);
        return;
    }
    peek() {
        if (this._q.length === 0) {
            return null;
        }
        return this._q[0];
    }
    peekDate() {
        if (this._q.length === 0) {
            return null;
        }
        return this._q[0].date;
    }
    getContents() {
        return this._q;
    }
}
exports.LogQueue = LogQueue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT0xEX0xPR19RLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL09MRF9MT0dfUS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLE1BQWEsUUFBUTtJQUdqQjtRQUZRLE9BQUUsR0FBeUIsRUFBRSxDQUFDO0lBRXZCLENBQUM7SUFFVCxJQUFJO1FBQ1AsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRU0sT0FBTztRQUNWLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBRyxvR0FBb0c7UUFDdkgsT0FBTyxDQUFZLHFGQUFxRjtJQUM1RyxDQUFDO0lBRU0sT0FBTyxDQUFDLE9BQXNCO1FBQ2pDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RCLE9BQU87SUFDWCxDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFDO1lBQ3BCLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVNLFFBQVE7UUFDWCxJQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBQztZQUNwQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMzQixDQUFDO0lBRU0sV0FBVztRQUNkLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNuQixDQUFDO0NBQ0o7QUFwQ0QsNEJBb0NDIn0=