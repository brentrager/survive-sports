import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
// import * as DailyRotateFile from 'winston-daily-rotate-file';
import { MFL } from './mfl';
import { PlayersManager } from './players-manager';
import { ApiServer } from './api-server';
import { FantasyPros } from './fantasy-pros';
import LabelledLogger from './labelled-logger';
import { UserTeamsManager } from './user-teams-manager';
import { MarchMadnessManager } from './march-madness-manager';

const logger = new LabelledLogger('Main');

// tslint:disable-next-line:no-floating-promises
(async () => {
    try {
        // Connection URL
        const dbName = 'survive-sports';
        const url = `mongodb://${process.env.DEV_MODE ? 'localhost' : 'survive-sports-mongo'}:27017`;

        // Connect mongoose
        await mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useCreateIndex: true } as any);
        const mongooseConnection = mongoose.connection;
        logger.info('Connected to mongoose');
        mongooseConnection.on('error', error => {
            logger.error(`Mongoose connection error: ${error}`);
        });

        // Connect mongoClient
        const mongoClient = await MongoClient.connect(url, { useNewUrlParser: true });
        logger.info('Connected to mongodb');

        const db = mongoClient.db(dbName);

        const mfl = new MFL();
        const fantasyPros = new FantasyPros();
        const playersManager = new PlayersManager(db, mfl, fantasyPros);
        //await playersManager.update();

        const userTeamsManager = new UserTeamsManager(playersManager);

        const marchMadnessManager = new MarchMadnessManager();
        marchMadnessManager.start();

        const apiServer = new ApiServer(playersManager, userTeamsManager, marchMadnessManager);
        await apiServer.start();
    } catch (error) {
        logger.error(`General error: ${error}`);
        console.error(error);
    }
})();
