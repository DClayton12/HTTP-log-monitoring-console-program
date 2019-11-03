# HTTP log monitoring console program
by Darnel Clayton

## Getting Started
### System Requirements
* node >=8.9.1

### How to Intall
* `npm install`

### How to Compile
* `npm run compile`

### Run Tests
* `npm run ut`

### Parameters
* `-f` <Mandatory> File Path to Log Events
* `-t` [Optional] Average traffic threshold. If flag is not used, value `10` will be as defaut.

### How to Execute
* `node dist/src/index.js -f ./sample_csv.txt`
* `node dist/src/index.js -f ./sample_csv.txt -t 12`

### HTTP log monitoring Solution
#### Part One:

Read a CSV-encoded HTTP access log. It should take the file as a parameter or read from standard input. For every 10 seconds of log lines, display stats about the traffic during those 10 seconds. The sections of the web site with the most hits, as well as statistics that might be useful for debugging.

I chose to implement a couple classes to help me acheieve the task. The class `LogQueue` is a data-structure will house processed log events. In particular, this `LogQueue` structure will only house log-events that are relevant to the window time allowale. Log-events that are not in the allowable window will not be persisted. The other class is `LogReporter` which processes log-events and also has the responsibility for statistic reporting and high traffic alerting. Class `LogReporter` has `LogQueue` as a private member and is leveraged to perform logic and calculations for both reporting and alerting.

#### Part Two:

Whenever total traffic for the past 2 minutes exceeds a certain number on average, print a message to the console saying "High traffic generated an alert - hits = { value }, triggered at { time }". The default threshold should be 10 requests per second but should be configurable.

Whenever the total traffic drops again below the value on average for the past 2 minutes, print another message detailing when the alert recovered, +/- a second.

For the purpose of statistic reporting and alerting, `LogReporter` has two distinct instances of `LogQueue` as membbers. Also there are two private members ( _tenSecondIntervalTracker and _twoMinuteIntervalTracker ) which track the sliding window of time for every 10 seconds for statistic reporting and 120 seconds for traffic alerting. 

As subsequent log-events are processed these interval-timers are updated if and only if the difference in time is beyond the time-to-live values(Reporting = 10 seoconds, Alerting = 120 seconds). This logic and updating time-intervals drive the logic to evict stale or old log-events from the respective `LogQueue`s.

To alert, current average of requests within the two-minute log-event window are calculated. If this calculated average greater than or equal to the set threshold an alert is printed to standard output. By use of another member, `LogReporter` maintains state if high traffic has been seen and alerted. This state will remain till the current average of requests within the two-minute window of log-events has below threshold, an alert that traffic is below threshold is printed standard output and the state will be updated.

#### Improvements to Solution

The `LogQueue` is a queue which its underlying data-structure is an array. Although functional, it is not optimal where elements are dequeued. Here is an O(N) operation with N defined as the number of elements that exists in the queue. The element dequeued is removed from the front of the array. Each subsequent element must by shifted forward (i-1), to the approrpiate index. To improve my implementation of `LogQueue` I would leverage a linked-list as the underlying data-structure and would make a dequeue operartion constant time.

The class `LogReporter` has private members which track time intervals and the sliding window of log-events. These intervals are used to drive the eviction policy of stale or old log-events from a `LogQueue`. To improve and seperate the concerns of eviction-policy further I would move the eviction implementation to the `LogQueue` class. The `LogReporter` class should only inspect the `LogQueue` to perform calulations but not to maintain the structure.
