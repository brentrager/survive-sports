/* tslint:disable:cyclomatic-complexity */
import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import { UserModel, User } from '../src/models/user';
import LabelledLogger from '../src/labelled-logger';
import * as fuzz from 'fuzzball';
import * as _ from 'lodash';

const logger = new LabelledLogger('LoadTeams');

(async () => {
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

    const users = [
        { id: 'auth0|5c939cd6f4b4b537d21140d3', name: 'heathpaulsen@hotmail.com' },
        { id: 'auth0|5c939ada08411b333f95540a', name: 'akratky@clpchem.com' },
        { id: 'auth0|5c93984728f8670aebd34dce', name: 'amuck@dmsi.com' },
        { id: 'facebook|10109656049386558', name: 'Brent Rager' },
        { id: 'auth0|5c938a1333935807f11223fe', name: 'brett.wickens@gmail.com' },
        { id: 'auth0|5c938d9135fe964ea01c9851', name: 'jrf@excaliburlipid.com' },
        { id: 'google-oauth2|102278302084945962430', name: 'Dennis Boyer' },
        { id: 'auth0|5c93aab533935807f1122621', name: 'jbart76@icloud.com' },
        { id: 'google-oauth2|110265972964449191528', name: 'Michael Furlong' },
        { id: 'google-oauth2|114755620748767240792', name: 'Nick Weidman' },
        { id: 'auth0|5c938733b2b79f7179e7203f', name: 'scott.mcdonn@gmail.com' },
        { id: 'auth0|5c93137e18548115f0501e2d', name: 'williams.chase@gmail.com' },
        { id: 'auth0|5c92af1735fe964ea01c8f8b', name: 'zsutphin33@yahoo.com' },
        { id: 'auth0|5c9390abf4b4b537d2114008', name: 'ahilden82@hotmail.com' },
        { id: 'facebook|10216458273042585', name: 'Tom Weidman' },
        { id: 'facebook|10218394145626017', name: 'Brian Barger' },
        { id: 'facebook|100002200345447', name: 'Joshua Childress' },
        { id: 'google-oauth2|102799086050410670094', name: 'Brad Jansen' },
        { id: 'facebook|10155929935071373', name: 'Drey LyBarger' },
        { id: 'google-oauth2|103699084426341994556', name: 'Jeffrey Chantiam' },
        { id: 'facebook|10102343215115124', name: 'Stephen Wilhelm' },
        { id: 'auth0|5c9300a2ba5cad125f5f197e', name: 'bdunk4@gmail.com' },
        { id: 'auth0|5c939d61e15d391e0f52567a', name: 'faulkj99@yahoo.com' },
        { id: 'google-oauth2|116520975190864360441', name: 'shane bland' },
        { id: 'auth0|5c93987d35fe964ea01c990e', name: 'alex81388@gmail.com' },
        { id: 'facebook|10112593511977909', name: 'Andrew Harmon' },
        { id: 'google-oauth2|104526187432733552451', name: 'Brandon N' },
        { id: 'auth0|5c936dfeba5cad125f5f1d10', name: 'cparker@clpchem.com' },
        { id: 'google-oauth2|111337670904032157416', name: 'danny ellsworth' },
        { id: 'auth0|5c93870bf4b4b537d2113f74', name: 'danny.higgins5@gmail.com' },
        { id: 'auth0|5c939c0508411b333f955427', name: 'jasonkremer83@gmail.com' },
        { id: 'auth0|5c92ffba33935807f1121e78', name: 'preter1@gmail.com' },
        { id: 'auth0|5c92f6cbba5cad125f5f1939', name: 'ryan.eckstein@gavilon.com' },
        { id: 'auth0|5c937f7035fe964ea01c9783', name: 'sparksbroc@gmail.com' },
        { id: 'auth0|5c93094d08411b333f954e7d', name: 'tomlacy85@gmail.com' },
        { id: 'google-oauth2|104011108609759470766', name: 'Trevor Templin' }
    ];

    for (const user of users) {
        const userDoc = await UserModel.findOne({ name: user.name }).exec();

        if (!userDoc) {
            const newUser = {
                id: user.id,
                name: user.name,
                email: 'wrong@email.com',
                roles: []
            };
            await UserModel.create(newUser);
            logger.info(`Created user ${user.name}`);
        } else {
            logger.info(`User ${user.name} already existed.`);
        }
    }

    await mongoClient.close();
    await mongoose.disconnect();
})().then().catch();