/* tslint:disable:cyclomatic-complexity */
import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import LabelledLogger from '../src/labelled-logger';
import * as _ from 'lodash';
import { ChoiceList, ChoiceListModel, PicksModel, PicksMongoose } from '../src/models/march-madness';
import { UserModel } from '../src/models/user';
import { Result } from 'range-parser';
import { join } from 'bluebird';

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

        logger.info('Updating picks');

        // Now load teams
        const choiceListMongoose = (await ChoiceListModel.findOne({}).exec())!.toObject();
        const usersDoc = await UserModel.find({}).exec();
        const picksDoc = await PicksModel.find({}).exec();
        const picksMongoose: Array<PicksMongoose> = picksDoc.map(x => x.toObject());

        const userNameMap = usersDoc.reduce((result, user) => {
            result.set(user.toObject().name, user.toObject());
            return result;
        }, new Map());

        const userIdMap = usersDoc.reduce((result, user) => {
            result.set(user.toObject().id, user.toObject());
            return result;
        }, new Map());

        const picksByUserNameMap: Map<string, Array<PicksMongoose>> = picksMongoose.reduce((result, picks) => {
            const user = userIdMap.get(picks.userId)!;
            let picksArray = result.has(user.name) ? result.get(user.name) : [];
            picksArray.push(picks);
            result.set(user.name, picksArray);
            return result;
        }, new Map());

        const choicesByTeamMap = choiceListMongoose.choices.reduce((result: Map<string, any>, choice: any) => {
            result.set(choice.team, choice);
            return result;
        }, new Map());


        async function  AddTeams(userName: string, teams: Array<string>) {
            const user = userNameMap.get(userName);
            const userPicks = picksByUserNameMap.get(userName);
            for (const userPick of userPicks!) {
                userPick.eliminated = false;
                if (!userPick.eliminated) {
                    userPick.choices[1] = {
                        roundOf: 32,
                        choices: teams.map(x => choicesByTeamMap.get(x))
                    };

                    await PicksModel.findOneAndUpdate({ _id: (userPick as any)._id }, userPick).exec();
                }
            }
        }

        await AddTeams('Brian Barger', ['Texas Tech', 'Virginia']);


        await mongoose.disconnect();
    } catch (error) {
        logger.error(`Error: ${error}`);
    }
})();
