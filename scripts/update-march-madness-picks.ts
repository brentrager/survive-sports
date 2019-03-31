/* tslint:disable:cyclomatic-complexity */
import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import LabelledLogger from '../src/labelled-logger';
import * as _ from 'lodash';
import { ChoiceList, ChoiceListModel, PicksModel, PicksMongoose, Choices } from '../src/models/march-madness';
import { UserModel, User } from '../src/models/user';
import { Result } from 'range-parser';
import { join } from 'bluebird';

const logger = new LabelledLogger('LoadMarchMadnessChoices');

interface RoundIndexMap {
    [key: number]: number;
}

const ROUND_INDEX_MAP: RoundIndexMap = {
    64: 0,
    32: 1,
    16: 2,
    8: 3,
    4: 4,
    2: 5
};

const ROUND_PICKS = [4, 2, 1, 1, 1, 1];

const ROUNDS = [64, 32, 16, 8, 4, 2];

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


        async function AddTeams(userName: string, teams: Array<string>, round: number) {
            const user = userNameMap.get(userName);
            const userPicks = picksByUserNameMap.get(userName);
            for (const userPick of userPicks!) {
                if (!userPick.eliminated) {
                    userPick.choices[ROUND_INDEX_MAP[round]] = {
                        roundOf: round,
                        choices: teams.map(x => choicesByTeamMap.get(x))
                    };

                    await PicksModel.findOneAndUpdate({ _id: (userPick as any)._id }, userPick).exec();
                }
            }
        }

        const picks = [
            { name: 'heathpaulsen@hotmail.com', teams: ['Kansas', 'Buffalo', 'Purdue', 'Maryland', 'Michigan State', 'Oregon'] },
            { name: 'akratky@clpchem.com', teams: ['Purdue', 'Virginia Tech', 'Florida State', 'Kansas', 'Oregon', 'Houston'] },
            { name: 'amuck@dmsi.com', teams: ['Kansas', 'Tennessee', 'LSU', 'Florida State', 'Oregon', 'Virginia Tech'] },
            { name: 'Brent Rager', teams: ['LSU', 'Florida State', 'Villanova', 'Kentucky', 'Oregon', 'Houston'] },
            { name: 'brett.wickens@gmail.com', teams: ['LSU', 'Texas Tech', 'Purdue', 'Kansas', 'Virginia Tech', 'Oregon'] },
            { name: 'jrf@excaliburlipid.com', teams: ['Kentucky', 'Buffalo', 'Oregon', 'Michigan State', 'Virginia Tech', 'Purdue'] },
            { name: 'Dennis Boyer', teams: ['Texas Tech', 'Purdue', 'Houston', 'Michigan State', 'Virginia Tech', 'Oregon'] },
            { name: 'jbart76@icloud.com', teams: ['Virginia Tech', 'Florida State', 'Purdue', 'Kentucky', 'Houston', 'Oregon'] },
            { name: 'jrf@excaliburlipid.com', teams: ['Duke', 'Michigan', 'Kentucky', 'Tennessee', 'Oregon', 'Houston'] },
            { name: 'Michael Furlong', teams: ['Houston', 'Florida State', 'Purdue', 'Virginia Tech', 'Oregon', 'Michigan State'] },
            { name: 'Nick Weidman', teams: ['LSU', 'Texas Tech', 'Purdue', 'Kentucky', 'Virginia Tech', 'Oregon'] },
            { name: 'scott.mcdonn@gmail.com', teams: ['Purdue', 'Houston', 'Virginia Tech', 'Florida State', 'Michigan State', 'Oregon'] },
            { name: 'williams.chase@gmail.com', teams: ['Purdue', 'Kentucky', 'Texas Tech', 'Virginia Tech', 'Oregon', 'North Carolina'] },
            { name: 'zsutphin33@yahoo.com', teams: ['Gonzaga', 'Michigan State', 'Purdue', 'Houston', 'Oregon', 'Virginia Tech'] },
            { name: 'zsutphin33@yahoo.com', teams: ['Texas Tech', 'Michigan State', 'Oregon', 'Houston', 'Virginia Tech', 'Gonzaga'] },
            { name: 'ahilden82@hotmail.com', teams: ['Minnesota', 'Texas Tech', 'Auburn', 'Villanova', 'Houston', 'Virginia Tech'] },
            { name: 'Tom Weidman', teams: ['Buffalo', 'Virginia Tech', 'Purdue', 'Kansas', 'Houston', 'Tennessee'] },
            { name: 'Brian Barger', teams: ['Virginia Tech', 'Florida State', 'Villanova', 'Houston', 'Texas Tech', 'Virginia'] },
            { name: 'Joshua Childress', teams: ['Houston', 'Villanova', 'LSU', 'Florida State', 'Virginia Tech', 'Michigan'] },
            { name: 'Brad Jansen', teams: ['Texas Tech', 'Auburn', 'LSU', 'Tennessee', 'Gonzaga', 'Virginia Tech'] },
            { name: 'Drey LyBarger', teams: ['Purdue', 'Kansas', 'Texas Tech', 'Michigan State', 'Kentucky', 'Michigan'] },
            { name: 'Jeffrey Chantiam', teams: ['Virginia Tech', 'Kansas', 'Purdue', 'Texas Tech', 'Tennessee', 'Michigan'] },
            { name: 'Stephen Wilhelm', teams: ['Virginia Tech', 'Houston', 'Michigan', 'Purdue', 'Virginia', 'Michigan State'] },
            { name: 'bdunk4@gmail.com', teams: ['Texas Tech', 'Purdue', 'Michigan State', 'Houston', 'Gonzaga', 'LSU'] },
            { name: 'faulkj99@yahoo.com', teams: ['Virginia Tech', 'Texas Tech', 'Purdue', 'Houston', 'Kansas', 'Tennessee'] },
            { name: 'shane bland', teams: ['Purdue', 'Michigan', 'Kentucky', 'Michigan State', 'Gonzaga', 'Kansas'] },
            { name: 'williams.chase@gmail.com', teams: ['LSU', 'Texas Tech', 'Purdue', 'Houston', 'Kansas', 'Oregon'] },
            { name: 'ahilden82@hotmail.com', teams: ['Mississippi State', 'Florida State', 'Kansas', 'Villanova'] },
            { name: 'ahilden82@hotmail.com', teams: ['UCF', 'ASU / SJU', 'Iowa State', 'Wisconsin'] },
            { name: 'ahilden82@hotmail.com', teams: ['Virginia Tech', 'Baylor', 'Kansas', 'Kansas State'] },
            { name: 'ahilden82@hotmail.com', teams: ['Yale', 'ASU / SJU', 'Iowa State', 'Cincinnati'] },
            { name: 'akratky@clpchem.com', teams: ['Cincinnati', 'Virginia Tech', 'Michigan', 'Houston'] },
            { name: 'akratky@clpchem.com', teams: ['Purdue', 'Louisville', 'Texas Tech', 'Kansas'] },
            { name: 'alex81388@gmail.com', teams: ['Florida State', 'Oregon', 'Mississippi State', 'Kansas', 'Houston', 'Virginia Tech'] },
            { name: 'amuck@dmsi.com', teams: ['Tennessee', 'Mississippi State', 'ASU / SJU', 'Kansas'] },
            { name: 'amuck@dmsi.com', teams: ['Virginia Tech', 'Florida State', 'Houston', 'Kansas State'] },
            { name: 'amuck@dmsi.com', teams: ['Iowa State', 'Belmont / Temple', 'Texas Tech', 'Kansas State'] },
            { name: 'Andrew Harmon', teams: ['Virginia Tech', 'Florida State', 'Houston', 'Kansas State'] },
            { name: 'Brandon N', teams: ['Murray State', 'Mississippi State', 'Villanova', 'Kansas'] },
            { name: 'Brent Rager', teams: ['Michigan', 'Cincinnati', 'Virginia Tech', 'Kansas'] },
            { name: 'cparker@clpchem.com', teams: ['Iowa State', 'Purdue', 'Virginia Tech', 'Texas Tech'] },
            { name: 'cparker@clpchem.com', teams: ['Belmont / Temple', 'Murray State', 'UC Irvine', 'Kansas'] },
            { name: 'cparker@clpchem.com', teams: ['Kentucky', 'Cincinnati', 'Mississippi State', 'Nevada'] },
            { name: 'cparker@clpchem.com', teams: ['Louisville', 'Buffalo', 'Villanova', 'Wofford'] },
            { name: 'cparker@clpchem.com', teams: ['Syracuse', 'UCF', 'Oregon', 'Utah State'] },
            { name: 'danny ellsworth', teams: ['Iowa State', 'LSU', 'Texas Tech', 'Purdue'] },
            { name: 'danny ellsworth', teams: ['Nevada', 'Virginia Tech', 'Houston', 'Purdue'] },
            { name: 'danny.higgins5@gmail.com', teams: ['Kentucky', 'Purdue', 'Texas Tech', 'Mississippi State'] },
            { name: 'faulkj99@yahoo.com', teams: ['Wofford', 'Villanova', 'Buffalo', 'Louisville'] },
            { name: 'faulkj99@yahoo.com', teams: ['Belmont / Temple', 'Murray State', 'Auburn', 'Oregon'] },
            { name: 'heathpaulsen@hotmail.com', teams: ['Kansas', 'Buffalo', 'Purdue', 'Yale'] },
            { name: 'jasonkremer83@gmail.com', teams: ['Mississippi State', 'Florida State', 'Kansas State', 'Kansas'] },
            { name: 'jbart76@icloud.com', teams: ['Mississippi State', 'Michigan', 'Villanova', 'Kansas'] },
            { name: 'jrf@excaliburlipid.com', teams: ['Iowa State', 'Michigan', 'Oregon', 'Virginia Tech', 'Michigan State', 'Florida State'] },
            { name: 'jrf@excaliburlipid.com', teams: ['Houston', 'Florida State', 'Purdue', 'Belmont / Temple'] },
            { name: 'jrf@excaliburlipid.com', teams: ['Auburn', 'Texas Tech', 'Villanova', 'Mississippi State', 'Saint Louis', 'Iona'] },
            { name: 'preter1@gmail.com', teams: ['Syracuse', 'Cincinnati', 'Louisville', 'Utah State'] },
            { name: 'ryan.eckstein@gavilon.com', teams: ['Virginia Tech', 'Kansas State', 'Houston', 'Florida State'] },
            { name: 'ryan.eckstein@gavilon.com', teams: ['LSU', 'Wisconsin', 'Kansas', 'Texas Tech'] },
            { name: 'sparksbroc@gmail.com', teams: ['Villanova', 'Seton Hall', 'Florida State', 'Mississippi State'] },
            { name: 'Stephen Wilhelm', teams: ['LSU', 'Kansas State', 'Kansas', 'Florida State'] },
            { name: 'tomlacy85@gmail.com', teams: ['LSU', 'Kansas State', 'Florida State', 'Houston'] },
            { name: 'Trevor Templin', teams: ['Virginia Tech', 'Purdue', 'Nevada', 'Houston'] },
            { name: 'williams.chase@gmail.com', teams: ['Syracuse', 'Maryland', 'Kentucky', 'Tennessee'] },
            { name: 'williams.chase@gmail.com', teams: ['Minnesota', 'Kansas State', 'Marquette', 'Iowa State'] },
        ];

        /*for (const pick of picks) {
            const userDoc = await UserModel.findOne({name: pick.name }).exec();

            if (userDoc) {
                logger.info(`Found user ${pick.name}`);

                const user: User = userDoc.toObject();

                const teamChoices: Array<Choices> = [];
                let index = 0;
                for (const pickNum of ROUND_PICKS) {
                    if (pick.teams.length >= pickNum) {
                        let teamsInRound = pick.teams.slice(0, pickNum);
                        teamChoices.push({
                            roundOf: ROUNDS[index],
                            choices: teamsInRound.map(x => choicesByTeamMap.get(x)!)
                        });
                        pick.teams = pick.teams.slice(pickNum);
                    } else {
                        break;
                    }
                    index++;
                }

                const picksMongoose: PicksMongoose = {
                    userId: user.id,
                    availableTeams: 0,
                    bestRound: 64,
                    eliminated: false,
                    tieBreaker: 1,
                    choices: teamChoices
                };

                await PicksModel.create(picksMongoose);

                logger.info(JSON.stringify(picksMongoose, null, 4));
            } else {
                logger.warn(`Unable to find user ${pick.name}`);
            }
        }*/

        await AddTeams('Drey LyBarger', ['Virginia'], 8);
        await AddTeams('bdunk4@gmail.com', ['Kentucky'], 8);
        await AddTeams('jrf@excaliburlipid.com', ['Virginia'], 8);
        await AddTeams('ahilden82@hotmail.com', ['Duke'], 8);


        await mongoose.disconnect();
    } catch (error) {
        logger.error(`Error: ${error}`);
    }
})().then().catch();
