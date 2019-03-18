// tslint:disable:quotemark max-line-length
import LabelledLogger from './labelled-logger';
import { PicksModel, Picks, PicksSchema, Results, PicksMongoose, ResultsSchema, Choice, RoundSchema, Choices, RoundOf64ChoicesSchema, RoundOf32ChoicesSchema, RoundOf16ChoicesSchema, RoundOf8ChoicesSchema, RoundOf4ChoicesSchema, RoundOf2ChoicesSchema, ChoiceListModel, ChoiceList, ChoiceListSchema } from './models/march-madness';
import { UserModel, User, UsersSchema } from './models/user';
import marchMadnessRoundService from './march-madness-round-service';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import * as Joi from 'joi';
import { userInfo } from 'os';

const logger = new LabelledLogger('MarchMadnessManager');

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

interface RoundSchemaMap {
    [key: number]: Joi.Schema;
}

const ROUND_SCHEMA_MAP: RoundSchemaMap = {
    64: RoundOf64ChoicesSchema,
    32: RoundOf32ChoicesSchema,
    16: RoundOf16ChoicesSchema,
    8: RoundOf8ChoicesSchema,
    4: RoundOf4ChoicesSchema,
    2: RoundOf2ChoicesSchema
};

export class MarchMadnessManager {

    constructor() {
    }

    private picksMongooseToPicksConverter(picksMongoose: PicksMongoose, user: User): Picks {
        return {
            user,
            choices: picksMongoose.choices,
            eliminated: picksMongoose.eliminated,
            bestRound: picksMongoose.bestRound,
            tieBreaker: picksMongoose.tieBreaker
        };
    }

    private picksToPicksMongooseConverter(picks: Picks): PicksMongoose {
        return {
            userId: picks.user.id,
            choices: picks.choices,
            eliminated: picks.eliminated,
            bestRound: picks.bestRound,
            tieBreaker: picks.tieBreaker
        };
    }

    public async getResults() {
        const usersDoc = await UserModel.find({}).exec();
        const users: Array<User> = (await UsersSchema.validate(usersDoc, { stripUnknown: true })) as any;

        const picksDoc = await PicksModel.find({}).exec();
        let picksMongooseArray: Array<PicksMongoose> = picksDoc as any;

        const usersMap = users.reduce((result, user) => {
            result.set(user.id, user);
            return result;
        }, new Map());

        const choiceListDoc: ChoiceList = (await ChoiceListModel.find({}).exec()) as any;
        const choiceList: ChoiceList = await ChoiceListSchema.validate(choiceListDoc, { stripUnknown: true });

        const choicesByTeam = choiceList.choices.reduce((result, choice) => {
            result.set(choice.team, choice);
            return result;
        }, new Map());

        const picks: Array<Picks> = picksMongooseArray.map((picksMongoose: PicksMongoose) => {
            const viewableChoices = picksMongoose.choices.filter(choice => marchMadnessRoundService.isViewableRound(choice.roundOf));
            let eliminated = false;
            for (const choices of viewableChoices) {
                for (const choice of choices.choices) {
                    if (choice.eliminated) {
                        eliminated = true;
                        break;
                    }
                }

                if (eliminated) {
                    break;
                }
            }
            const picks: Picks = {
                user: usersMap.get(picksMongoose.userId),
                choices: viewableChoices,
                eliminated,
                bestRound: picksMongoose.bestRound,
                tieBreaker: picksMongoose.tieBreaker
            };
            return picks;
        });

        const results: Results = (await ResultsSchema.validate({ picks }, { stripUnknown: true }));

        results.picks = results.picks.sort((a, b) => {
            if (!a.eliminated && b.eliminated) {
                return -1;
            }

            if (!b.eliminated && a.eliminated) {
                return 1;
            }

            if (a.bestRound < b.bestRound) {
                return -1;
            }

            if (b.bestRound < a.bestRound) {
                return 1;
            }

            if (a.tieBreaker > b.tieBreaker) {
                return -1;
            }

            if (b.tieBreaker > a.tieBreaker) {
                return 1;
            }

            return a.user.name.localeCompare(b.user.name);
        });

        return results;
    }

    private async getOrCreatePicksByUser(user: User) {
        let picksDoc = await PicksModel.findOne({ userId: user.id }).exec();
        if (!picksDoc) {
            const picksMongoose: PicksMongoose = {
                userId: user.id,
                choices: [],
                eliminated: false,
                bestRound: 64,
                tieBreaker: 1
            };
            picksDoc = await PicksModel.create(picksMongoose);
        }

        return picksDoc;
    }

    public async getPicksByUser(user: User) {
        const picksDoc = await this.getOrCreatePicksByUser(user);
        let picksMongoose: PicksMongoose = picksDoc as any;
        const picksRaw = this.picksMongooseToPicksConverter(picksMongoose, user);
        const picks: Picks = (await PicksSchema.validate(picksRaw, { stripUnknown: true }));

        return picks;
    }

    public async getUserChoices(user: User) {
        const choiceListDoc: ChoiceList = (await ChoiceListModel.find({}).exec()) as any;
        const choiceList: ChoiceList = await ChoiceListSchema.validate(choiceListDoc, { stripUnknown: true });
        choiceList.choices = choiceList.choices.filter(x => !x.eliminated);

        const picks = await this.getPicksByUser(user);

        const teamSet = new Set();

        for (const choices of picks.choices) {
            for (const choice of choices.choices) {
                teamSet.add(choice.team);
            }
        }

        choiceList.choices = choiceList.choices.filter(x => !teamSet.has(x.team));

        return choiceList;
    }

    public async setPickForUser(user: User, choices: Choices) {
        const round = await RoundSchema.validate(choices.roundOf);

        if (!marchMadnessRoundService.isAvailableRound(round)) {
            throw new Error(`Round ${round} cannot be set.`)
        }

        const picks = await this.getPicksByUser(user);

        if (picks.eliminated) {
            throw new Error(`User ${user.name} already eliminated.`);
        }

        const roundIndex = ROUND_INDEX_MAP[round];

        if (picks.choices.length < roundIndex) {
            throw new Error(`Can't set round ${round} because previous rounds are not set.`);
        }

        if (picks.choices.length >= roundIndex) {
            throw new Error(`Can't set round ${round} that's already been set.`);
        }

        const roundSchema = ROUND_SCHEMA_MAP[round];

        choices.choices = await roundSchema.validate(choices.choices);

        picks.choices[roundIndex] = choices;

        const teamSet = new Set();

        for (const choices of picks.choices) {
            for (const choice of choices.choices) {
                if (teamSet.has(choice.team)) {
                    throw new Error(`Tried to select a team more than once: ${choice.team}`);
                }
                teamSet.add(choice.team);
            }
        }

        picks.choices.forEach(choices => {
            choices.choices.forEach
        })

        const picksMongoose = this.picksToPicksMongooseConverter(picks);

        await PicksModel.findOneAndUpdate({ userId: user.id }, picksMongoose).exec();

        return picks;
    }
}