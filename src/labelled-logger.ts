import { createLogger, format, transports } from 'winston';
import * as moment from 'moment-timezone';

const winstonLogger = createLogger({
    format: format.combine(
        format.colorize(),
        format.prettyPrint(),
        format.printf(info => {
            return `${moment().tz('America/New_York').format()} ${info.level}: ${info.message}`;
        })
    ),
    transports: [
        /*new DailyRotateFile({
            filename: 'survive-sports-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d',
            handleExceptions: true
        }),*/
        new transports.Console({
            handleExceptions: true
        })
    ]
});

export default class LabelledLogger {
    private label: string = '';
    constructor(label: string) {
        this.label = label;
    }

    info(msg: any): void {
        winstonLogger.info(`${this.label}: ${msg}`);
    }

    warn(msg: any): void {
        winstonLogger.warn(`${this.label}: ${msg}`);
    }

    error(msg: any): void {
        winstonLogger.error(`${this.label}: ${msg}`);
    }

    verbose(msg: any): void {
        winstonLogger.verbose(`${this.label}: ${msg}`);
    }
}