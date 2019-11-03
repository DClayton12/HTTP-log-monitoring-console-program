"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const es = require("event-stream");
const log_file_service_1 = require("./services/log-file-service");
const log_reporter_1 = require("./utils/log-reporter");
// import { LogReporter } from './utils/OLD_REPORTER';
const constants_1 = require("./constants");
// import {Argv} from "yargs";
function main() {
    const argv = yargs
        .option("logFilePath", {
        desribe: "HTTP access log in CSV format",
        demandOption: true,
        alias: "f"
    })
        .option("trafficThreshold", {
        desribe: "Number of requests to alert on. Default = 10 requests/second",
        demandOption: false,
        alias: "t"
    })
        .help()
        .argv;
    const trafficThreshold = argv.trafficThreshold || constants_1.DEFAULT_TRAFFIC_THRESHOLD;
    const logReporter = new log_reporter_1.LogReporter(trafficThreshold);
    const fileReader = log_file_service_1.LogFileReader.createFileReader(argv.logFilePath);
    fileReader
        .getInstance()
        .pipe((es || "").split(""))
        .pipe(es.mapSync((line) => {
        logReporter.processLogLine(line);
    }));
    return;
}
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBK0I7QUFDL0IsbUNBQW1DO0FBQ25DLGtFQUE0RDtBQUM1RCx1REFBbUQ7QUFDbkQsc0RBQXNEO0FBQ3RELDJDQUF3RDtBQUN4RCw4QkFBOEI7QUFHOUIsU0FBUyxJQUFJO0lBQ1QsTUFBTSxJQUFJLEdBQUcsS0FBSztTQUNiLE1BQU0sQ0FBQyxhQUFhLEVBQUU7UUFDbkIsT0FBTyxFQUFFLCtCQUErQjtRQUN4QyxZQUFZLEVBQUUsSUFBSTtRQUNsQixLQUFLLEVBQUUsR0FBRztLQUNiLENBQUM7U0FDRCxNQUFNLENBQUMsa0JBQWtCLEVBQUU7UUFDeEIsT0FBTyxFQUFFLDhEQUE4RDtRQUN2RSxZQUFZLEVBQUUsS0FBSztRQUNuQixLQUFLLEVBQUUsR0FBRztLQUNiLENBQUM7U0FDRCxJQUFJLEVBQUU7U0FDTixJQUFJLENBQUM7SUFHVixNQUFNLGdCQUFnQixHQUFXLElBQUksQ0FBQyxnQkFBMEIsSUFBSSxxQ0FBeUIsQ0FBQztJQUM5RixNQUFNLFdBQVcsR0FBZ0IsSUFBSSwwQkFBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDbkUsTUFBTSxVQUFVLEdBQUcsZ0NBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBcUIsQ0FBQyxDQUFDO0lBRTlFLFVBQVU7U0FDTCxXQUFXLEVBQUU7U0FDYixJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzFCLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUNaLENBQUMsSUFBWSxFQUFFLEVBQUU7UUFDYixXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUMsQ0FDSixDQUFDLENBQUM7SUFDUCxPQUFPO0FBQ1gsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDIn0=