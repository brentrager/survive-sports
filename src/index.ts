import { MongoClient } from 'mongodb';
import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { MFL } from './mfl';
import { PlayersManager } from './players-manager';
import { ApiServer } from './api-server';
import { FantasyPros } from './fanatasy-pros';
import LabelledLogger from './labelled-logger';

const winstonLogger = createLogger({
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

const logger = new LabelledLogger(winstonLogger, 'Main');

(async () => {
    try {
        // Connection URL
        const url = 'mongodb://localhost:27017';

        // Database Name

        const mongoClient = await MongoClient.connect(url);
        logger.info('Connected to mongodb');

        const dbName = 'survive-sports';
        const db = mongoClient.db(dbName);

        const mfl = new MFL(winstonLogger);
        const fantasyPros = new FantasyPros(winstonLogger);
        const playersManager = new PlayersManager(winstonLogger, db, mfl, fantasyPros);
        await playersManager.update();

        const apiServer = new ApiServer(winstonLogger, playersManager);
        await apiServer.start();
    } catch (error) {
        logger.error(`General error: ${error}`);
        console.error(error);
    }
})();
