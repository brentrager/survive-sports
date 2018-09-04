import { MongoClient } from 'mongodb';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { MFL } from './mfl';
import { PlayersManager } from './players-manager';
import { ApiServer } from './api-server';

const logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.prettyPrint(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new DailyRotateFile({
            filename: 'survive-sports-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d',
            handleExceptions: true
        }),
        new transports.Console({
            handleExceptions: true
        })
    ]
});

(async () => {
    try {
        // Connection URL
        const url = 'mongodb://localhost:27017';

        // Database Name

        const mongoClient = await MongoClient.connect(url);
        logger.info('Connected to mongodb');

        const dbName = 'survive-sports';
        const db = mongoClient.db(dbName);

        const mfl = new MFL(logger);
        const playersManager = new PlayersManager(logger, db, mfl);
        await playersManager.update();

        const apiServer = new ApiServer(logger, playersManager);
        await apiServer.start();
    } catch (error) {
        logger.error(`General error: ${error}`);
        console.error(error);
    }
})();
