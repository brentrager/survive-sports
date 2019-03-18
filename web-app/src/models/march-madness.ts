/* tslint:disable:variable-name max-line-length */
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

export const ChoiceSchema = Joi.object().keys({
    region: RegionSchema.required(),
    seed: SeedSchema.required(),
    team: Joi.string().required(),
    eliminated: Joi.boolean().required()
});

export interface ChoiceList {
    choices: Array<Choice>;
}

export const ChoiceListSchema = Joi.object().keys({
    choices: Joi.array().items(ChoiceSchema).required()
});

export interface Choices {
    roundOf: number;
    choices: Array<Choice>;
}

export const ChoicesSchema = Joi.object().keys({
    roundOf: RoundSchema.required(),
    choices: Joi.array().min(1).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf64ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(64).required(),
    choices: Joi.array().length(4).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf32ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(32).required(),
    choices: Joi.array().length(2).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf16ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(16).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf8ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(8).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf4ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(4).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export const RoundOf2ChoicesSchema = Joi.object().keys({
    roundOf: Joi.number().allow(2).required(),
    choices: Joi.array().length(1).items(ChoiceSchema).unique((a, b) => a.region === b.region).required()
});

export interface Picks {
    user: User;
    choices: Array<Choices>;
    eliminated: boolean;
    bestRound: number;
    tieBreaker: number;
}

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
    tieBreaker: SeedSchema.required()
});

export interface Results {
    picks: Array<Picks>;
}

export const ResultsSchema = Joi.object().keys({
    picks: Joi.array().items(PicksSchema).required()
});
