import { MongoClient } from 'mongodb';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new DailyRotateFile({
            filename: 'survive-sports-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d'
        }),
        new transports.Console()
    ]
});

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'survive-sports';

MongoClient.connect(url, function (err, client) {

    if (err) {
        logger.error(err)
    }
    logger.info('Connected to mongodb');

    const db = client.db(dbName);
    logger.info(db);

    client.close();
});