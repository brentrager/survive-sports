// tslint:disable:quotemark max-line-length
import LabelledLogger from './labelled-logger';
import { PicksModel, Picks, PicksSchema, Results, PicksMongoose, ResultsSchema, Choice, RoundSchema, Choices, RoundOf64ChoicesSchema, RoundOf32ChoicesSchema, RoundOf16ChoicesSchema, RoundOf8ChoicesSchema, RoundOf4ChoicesSchema, RoundOf2ChoicesSchema, ChoiceListModel, ChoiceList, ChoiceListSchema, PicksArraySchema } from './models/march-madness';
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

    public start() {
        this.updateResults();
    }

    private async getChoices() {
        const choiceListDoc = (await ChoiceListModel.findOne({}).exec());

        if (!choiceListDoc) {
            throw new Error('Unable to load choice list');
        }

        const choiceList: ChoiceList = await ChoiceListSchema.validate(choiceListDoc.toObject(), { stripUnknown: true });
        choiceList.choices = choiceList.choices.filter(x => !x.eliminated);

        return choiceList;
    }

    private picksMongooseToPicksConverter(picksMongoose: PicksMongoose, user: User, choiceList: ChoiceList): Picks {
        const teamSet = new Set();
        for (const choices of picksMongoose.choices) {
            if (!marchMadnessRoundService.isAvailableRound(choices.roundOf)) {
                for (const choice of choices.choices) {
                    teamSet.add(choice.team);
                }
            }
        }

        const availableChoices = choiceList.choices.filter(x => !teamSet.has(x.team));

        return {
            user,
            choices: picksMongoose.choices,
            eliminated: picksMongoose.eliminated,
            bestRound: picksMongoose.bestRound,
            tieBreaker: picksMongoose.tieBreaker,
            availableChoices
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

    private getChoicesByTeam(choiceList: ChoiceList) {
        return choiceList.choices.reduce((result, choice) => {
            result.set(choice.team, choice);
            return result;
        }, new Map());
    }

    private async updateResults() {
        try {
            const picksDoc = await PicksModel.find({}).exec();
            let picksMongooseArray: Array<PicksMongoose> = picksDoc.map(x => x.toObject());

            const choiceListDoc = (await ChoiceListModel.findOne({}).exec());
            if (!choiceListDoc) {
                throw new Error('Unable to load choice list.');
            }
            const choiceList: ChoiceList = await ChoiceListSchema.validate(choiceListDoc.toObject(), { stripUnknown: true });

            const choicesByTeam = this.getChoicesByTeam(choiceList);

            for (const picksMongoose of picksMongooseArray) {
                for (const choices of picksMongoose.choices) {
                    let eliminatedInRound = false;
                    for (const choice of choices.choices) {
                        const actualChoice = choicesByTeam.get(choice.team);
                        if (actualChoice) {
                            choice.eliminated = actualChoice.eliminated;
                            if (choice.eliminated) {
                                if (marchMadnessRoundService.isAvailableRound(choices.roundOf)) {
                                    picksMongoose.eliminated = true;
                                    eliminatedInRound = true;
                                }
                            }
                        }
                    }

                    if (!eliminatedInRound && marchMadnessRoundService.isAvailableRound(choices.roundOf)) {
                        picksMongoose.bestRound = Math.min(picksMongoose.bestRound, choices.roundOf);
                        picksMongoose.tieBreaker = Math.max(picksMongoose.tieBreaker, ...choices.choices.map(x => x.seed));
                    }
                }
            }

            await PicksModel.updateMany({}, picksMongooseArray).exec();

            logger.info('Updated results');
        } catch (error) {
            logger.error(`Error udpating results: ${error}`);
        }

        setTimeout(() => {
            this.updateResults();
        }, 30 * 1000);
    }

    public async getResults() {
        const usersDoc = await UserModel.find({}).exec();
        const users: Array<User> = (await UsersSchema.validate(usersDoc.map(x => x.toObject()), { stripUnknown: true })) as any;

        const picksDoc = await PicksModel.find({}).exec();
        let picksMongooseArray: Array<PicksMongoose> = picksDoc.map(x => x.toObject());

        const usersMap = users.reduce((result, user) => {
            result.set(user.id, user);
            return result;
        }, new Map());

        const picks: Array<Picks> = picksMongooseArray.map((picksMongoose: PicksMongoose) => {
            const picks: Picks = {
                user: usersMap.get(picksMongoose.userId),
                choices: picksMongoose.choices.filter(choice => marchMadnessRoundService.isViewableRound(choice.roundOf)),
                eliminated: picksMongoose.eliminated,
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

    public async createPicksForUser(user: User) {
        if (marchMadnessRoundService.hasGameStarted()) {
            throw new Error('Game already started.');
        }
        let picksArrayDoc = await PicksModel.find({ userId: user.id }).exec();

        let picksArrayMongoose: Array<PicksMongoose> = picksArrayDoc.map(x => x.toObject());

        const newPicksMongoose = {
            userId: user.id,
            choices: [],
            eliminated: false,
            bestRound: 64,
            tieBreaker: 1
        };

        picksArrayMongoose.push(newPicksMongoose);

        await PicksModel.create(newPicksMongoose);

        const choiceList = await this.getChoices();

        const picksRaw = picksArrayMongoose.map(x => this.picksMongooseToPicksConverter(x, user, choiceList));
        const picks: Array<Picks> = (await PicksArraySchema.validate(picksRaw, { stripUnknown: true }));

        return picks;
    }

    public async deletePicksForUser(user: User, pickIndex: number) {
        if (marchMadnessRoundService.hasGameStarted()) {
            throw new Error('Game already started.');
        }
        let picksArrayDoc = await PicksModel.find({ userId: user.id }).exec();

        let picksArrayMongoose: Array<PicksMongoose> = picksArrayDoc.map(x => x.toObject());

        if (picksArrayMongoose.length > pickIndex) {
            picksArrayMongoose.splice(pickIndex, 1);
        } else {
            throw new Error('Pick index does not exist');
        }

        const id = picksArrayDoc[pickIndex]._id;

        await PicksModel.deleteOne({ _id: id }).exec();

        const choiceList = await this.getChoices();

        const picksRaw = picksArrayMongoose.map(x => this.picksMongooseToPicksConverter(x, user, choiceList));
        const picks: Array<Picks> = (await PicksArraySchema.validate(picksRaw, { stripUnknown: true }));

        return picks;
    }

    public async getPicksByUser(user: User) {
        let picksArrayDoc = await PicksModel.find({ userId: user.id }).exec();

        let picksArrayMongoose: Array<PicksMongoose> = picksArrayDoc.map(x => x.toObject());
        const choiceList = await this.getChoices();
        const picksRaw = picksArrayMongoose.map(x => this.picksMongooseToPicksConverter(x, user, choiceList));
        const picks: Array<Picks> = (await PicksArraySchema.validate(picksRaw, { stripUnknown: true }));

        return picks;
    }

    public async setPickForUser(user: User, pickIndex: number, choices: Choices) {
        let picksArrayDoc = await PicksModel.find({ userId: user.id }).exec();

        let picksArrayMongoose: Array<PicksMongoose> = picksArrayDoc.map(x => x.toObject());
        const choiceList = await this.getChoices();
        const picksRaw = picksArrayMongoose.map(x => this.picksMongooseToPicksConverter(x, user, choiceList));
        const picksArray: Array<Picks> = (await PicksArraySchema.validate(picksRaw, { stripUnknown: true }));

        if (picksArrayDoc.length <= pickIndex) {
            throw new Error(`Pick index ${pickIndex} does not exist.`);
        }

        const round = await RoundSchema.validate(choices.roundOf);

        if (!marchMadnessRoundService.isAvailableRound(round)) {
            throw new Error(`Round ${round} cannot be set.`)
        }

        const picks = picksArray[pickIndex];

        if (picks.eliminated) {
            throw new Error(`User ${user.name} already eliminated.`);
        }

        const roundIndex = ROUND_INDEX_MAP[round];

        if (picks.choices.length < roundIndex) {
            throw new Error(`Can't set round ${round} because previous rounds are not set.`);
        }

        const roundSchema = ROUND_SCHEMA_MAP[round];

        choices = await roundSchema.validate(choices);

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

        await PicksModel.findOneAndUpdate({ _id: picksArrayDoc[pickIndex]._id }, picksMongoose).exec();

        return picksArray;
    }
}