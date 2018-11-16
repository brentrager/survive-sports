import { MongoClient } from 'mongodb';
import LabelledLogger from '../src/labelled-logger';
import { UserModel } from '../src/models/user';
import { UserTeamsModel } from '../src/models/league';
import * as mongoose from 'mongoose';

const logger = new LabelledLogger('EraseMongo');

(async () => {
    const url = `mongodb://${process.env.DEV_MODE ? 'localhost' : 'survive-sports-mongo'}:27017`;
    const mongoClient = await MongoClient.connect(url, { useNewUrlParser: true });
    const dbName = 'survive-sports';
    const db = mongoClient.db(dbName);
    logger.info('Connected to mongodb');

    // Connect mongoose
    await mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useCreateIndex: true } as any);
    const mongooseConnection = mongoose.connection;
    logger.info('Connected to mongoose');
    mongooseConnection.on('error', error => {
        logger.error(`Mongoose connection error: ${error}`);
    });

    await db.collection('players').deleteMany({});
    await db.collection('rankings').deleteMany({});
    // await UserModel.deleteMany({}).exec();
    await UserTeamsModel.deleteMany({}).exec();

    logger.info('Mongo erased.');

    await mongoClient.close();
    await mongoose.disconnect();
})();