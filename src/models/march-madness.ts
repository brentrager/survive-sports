/* tslint:disable:variable-name max-line-length */
import * as mongoose from 'mongoose';
import { User, UserSchema } from './user';
import * as Joi from 'joi';

export const RegionSchema = Joi.string().allow('east', 'south', 'west', 'midwest');
export const SeedSchema = Joi.number().min(1).max(16);
export const RoundSchema = Joi.number().valid(64, 32, 16, 8, 4, 2);

export interface Choice {
    region: string;
    seed: number;
    team: string;
    eliminated: boolean;
}

export const ChoiceMongooseSchema = new mongoose.Schema({
    region: String,
    seed: Number,
    team: String,
    eliminated: Boolean
});

export const ChoiceSchema = Joi.object().keys({
    region: RegionSchema.required(),
    seed: SeedSchema.required(),
    team: Joi.string().required(),
    eliminated: Joi.boolean().required()
});

export interface ChoiceList {
    choices: Array<Choice>;
}

export const ChoiceListMongoSchema = new mongoose.Schema({
    choices: [ChoiceMongooseSchema]
});

export const ChoiceListModel = mongoose.model('marchMadnessChoiceList', ChoiceListMongoSchema);

export const ChoiceListSchema = Joi.object().keys({
    choices: Joi.array().items(ChoiceSchema).required()
});

export interface Choices {
    roundOf: number;
    choices: Array<Choice>;
}

export const ChoicesMongooseSchema = new mongoose.Schema({
    roundOf: Number,
    choices: [ChoiceMongooseSchema],
});

export const ChoicesSchema = Joi.object().keys({
    roundOf: RoundSchema.required(),
    choices: Joi.array().min(1).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf64ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(64).required(),
    choices: Joi.array().length(4).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf32ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(32).required(),
    choices: Joi.array().length(2).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf16ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(16).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf8ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(8).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf4ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(4).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.team).required()
});

export const RoundOf2ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(2).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region || a.team === b.tea).required()
});

export interface PicksMongoose {
    userId: string;
    choices: Array<Choices>;
    eliminated: boolean;
    bestRound: number;
    tieBreaker: number;
}

export interface Picks {
    user: User;
    choices: Array<Choices>;
    eliminated: boolean;
    bestRound: number;
    tieBreaker: number;
    availableChoices?: Array<Choice>;
}

export const PicksMongooseSchema = new mongoose.Schema({
    userId: String,
    choices: [ChoicesMongooseSchema],
    eliminated: Boolean,
    bestRound: Number,
    tieBreaker: Number
});

export const PicksSchema = Joi.object().keys({
    user: UserSchema.required(),
    choices: Joi.array().max(6).ordered(
        RoundOf64ChoicesSchema,
        RoundOf32ChoicesSchema,
        RoundOf16ChoicesSchema,
        RoundOf8ChoicesSchema,
        RoundOf4ChoicesSchema,
        RoundOf2ChoicesSchema).required(),
    eliminated: Joi.boolean().required(),
    bestRound: RoundSchema.required(),
    tieBreaker: SeedSchema.required(),
    availableChoices: Joi.array().items(ChoiceSchema).optional()
});

export const PicksArraySchema = Joi.array().items(PicksSchema);

export interface Results {
    picks: Array<Picks>;
}

export const ResultsSchema = Joi.object().keys({
    picks: Joi.array().items(PicksSchema).required()
});

export const PicksModel = mongoose.model('marchMadnessPicks', PicksMongooseSchema);
