/* tslint:disable:cyclomatic-complexity */
import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import LabelledLogger from '../src/labelled-logger';
import * as _ from 'lodash';
import { ChoiceList, ChoiceListModel } from '../src/models/march-madness';

const logger = new LabelledLogger('LoadMarchMadnessChoices');

(async () => {
    try {
        const dbName = 'survive-sports';
        const url = `mongodb://${process.env.DEV_MODE ? 'localhost' : 'survive-sports-mongo'}:27017`;

        // Connect mongoose
        await mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useCreateIndex: true } as any);
        const mongooseConnection = mongoose.connection;
        logger.info('Connected to mongoose');
        mongooseConnection.on('error', error => {
            logger.error(`Mongoose connection error: ${error}`);
        });

        logger.info('Updating choice list');

        // Now load teams
        const choiceList: ChoiceList = {
            choices: [
                { seed: 1, team: 'Duke', region: 'east', eliminated: false, winningRounds: [64] },
                { seed: 16, team: 'NCCU / NDSU', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 8, team: 'VCU', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 9, team: 'UCF', region: 'east', eliminated: false, winningRounds: [64] },
                { seed: 5, team: 'Mississippi State', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 12, team: 'Liberty', region: 'east', eliminated: true, winningRounds: [64] },
                { seed: 4, team: 'Virginia Tech', region: 'east', eliminated: false, winningRounds: [64, 32] },
                { seed: 13, team: 'Saint Louis', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 6, team: 'Maryland', region: 'east', eliminated: true, winningRounds: [64] },
                { seed: 11, team: 'Belmont / Temple', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 3, team: 'LSU', region: 'east', eliminated: false, winningRounds: [64, 32] },
                { seed: 14, team: 'Yale', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 7, team: 'Louisville', region: 'east', eliminated: true, winningRounds: [] },
                { seed: 10, team: 'Minnesota', region: 'east', eliminated: true, winningRounds: [64] },
                { seed: 2, team: 'Michigan State', region: 'east', eliminated: false, winningRounds: [64, 32] },
                { seed: 15, team: 'Bradley', region: 'east', eliminated: true, winningRounds: [] },

                { seed: 1, team: 'Gonzaga', region: 'west', eliminated: false, winningRounds: [64, 32] },
                { seed: 16, team: 'FDU / PV', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 8, team: 'Syracuse', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 9, team: 'Baylor', region: 'west', eliminated: true, winningRounds: [64] },
                { seed: 5, team: 'Marquette', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 12, team: 'Murray State', region: 'west', eliminated: true, winningRounds: [64] },
                { seed: 4, team: 'Florida State', region: 'west', eliminated: false, winningRounds: [64, 32] },
                { seed: 13, team: 'Vermont', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 6, team: 'Buffalo', region: 'west', eliminated: true, winningRounds: [64, 32] },
                { seed: 11, team: 'ASU / SJU', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 3, team: 'Texas Tech', region: 'west', eliminated: false, winningRounds: [64] },
                { seed: 14, team: 'Northern Kentucky', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 7, team: 'Nevada', region: 'west', eliminated: true, winningRounds: [] },
                { seed: 10, team: 'Florida', region: 'west', eliminated: true, winningRounds: [64] },
                { seed: 2, team: 'Michigan', region: 'west', eliminated: false, winningRounds: [64, 32] },
                { seed: 15, team: 'Montana', region: 'west', eliminated: true, winningRounds: [] },

                { seed: 1, team: 'Virginia', region: 'south', eliminated: false, winningRounds: [64, 32] },
                { seed: 16, team: 'Gardner Webb', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 8, team: 'Ole Miss', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 9, team: 'Oklahoma', region: 'south', eliminated: true, winningRounds: [64] },
                { seed: 5, team: 'Wisconsin', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 12, team: 'Oregon', region: 'south', eliminated: false, winningRounds: [64, 32] },
                { seed: 4, team: 'Kansas State', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 13, team: 'UC Irvine', region: 'south', eliminated: true, winningRounds: [64] },
                { seed: 6, team: 'Villanova', region: 'south', eliminated: true, winningRounds: [64] },
                { seed: 11, team: 'Saint Mary\'s', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 3, team: 'Purdue', region: 'south', eliminated: false, winningRounds: [64, 32] },
                { seed: 14, team: 'Old Dominion', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 7, team: 'Cincinnati', region: 'south', eliminated: true, winningRounds: [] },
                { seed: 10, team: 'Iowa', region: 'south', eliminated: true, winningRounds: [64] },
                { seed: 2, team: 'Tennessee', region: 'south', eliminated: false, winningRounds: [64, 32] },
                { seed: 15, team: 'Colgate', region: 'south', eliminated: true, winningRounds: [] },

                { seed: 1, team: 'North Carolina', region: 'midwest', eliminated: false, winningRounds: [64, 32] },
                { seed: 16, team: 'Iona', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 8, team: 'Utah State', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 9, team: 'Washington', region: 'midwest', eliminated: true, winningRounds: [64] },
                { seed: 5, team: 'Auburn', region: 'midwest', eliminated: false, winningRounds: [64, 32] },
                { seed: 12, team: 'New Mexico State', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 4, team: 'Kansas', region: 'midwest', eliminated: true, winningRounds: [64] },
                { seed: 13, team: 'Northeastern', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 6, team: 'Iowa State', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 11, team: 'Ohio State', region: 'midwest', eliminated: true, winningRounds: [64] },
                { seed: 3, team: 'Houston', region: 'midwest', eliminated: false, winningRounds: [64, 32] },
                { seed: 14, team: 'Georgia State', region: 'midwest', eliminated: true, winningRounds: [] },
                { seed: 7, team: 'Wofford', region: 'midwest', eliminated: true, winningRounds: [64] },
                { seed: 10, team: 'Seton Hall', region: 'midwest', eliminated: true , winningRounds: []},
                { seed: 2, team: 'Kentucky', region: 'midwest', eliminated: false, winningRounds: [64, 32] },
                { seed: 15, team: 'Abilene Christian', region: 'midwest', eliminated: true, winningRounds: [] },
            ]
        }

        await ChoiceListModel.findOneAndUpdate({}, choiceList, { upsert: true }).exec();

        await mongoose.disconnect();
    } catch (error) {
        logger.error(`Error: ${error}`);
    }
})();
