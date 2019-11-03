import * as yargs from 'yargs';
import * as es from 'event-stream';
import { LogFileReader } from './services/log-file-service';
import { LogReporter } from './utils/log-reporter';
// import { LogReporter } from './utils/OLD_REPORTER';
import { DEFAULT_TRAFFIC_THRESHOLD } from './constants';
// import {Argv} from "yargs";


function main(){
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
    
    
    const trafficThreshold: number = argv.trafficThreshold as number || DEFAULT_TRAFFIC_THRESHOLD;
    const logReporter: LogReporter = new LogReporter(trafficThreshold);
    const fileReader = LogFileReader.createFileReader(argv.logFilePath as string);

    fileReader
        .getInstance()
        .pipe((es || "").split(""))
        .pipe(es.mapSync(
            (line: string) => {
                logReporter.processLogLine(line);
            }
        ));
    return;
}

main();
