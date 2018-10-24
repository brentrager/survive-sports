import { MongoClient } from 'mongodb';
import LabelledLogger from '../labelled-logger';

const logger = new LabelledLogger('EraseMongo');

(async () => {
    const url = `mongodb://${process.env.DEV_MODE ? 'localhost' : 'survive-sports-mongo'}:27017`;
    const mongoClient = await MongoClient.connect(url, { useNewUrlParser: true });
    const dbName = 'survive-sports';
    const db = mongoClient.db(dbName);

    db.collection('players').deleteMany({});
    db.collection('rankings').deleteMany({});
    db.collection('User').deleteMany({});
    db.collection('Team').deleteMany({});
    db.collection('user').deleteMany({});
    db.collection('userTeams').deleteMany({});

    logger.info('Mongo erased.');

    mongoClient.close();
})();