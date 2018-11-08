/* tslint:disable:variable-name */
import * as Joi from 'joi';

export interface User {
    id: string;
    email: string;
    name: string;
    roles: Array<string>;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

export const UserSchema = Joi.object().keys({
    id: Joi.string().required(),
    email: Joi.string().required(),
    name: Joi.string().required(),
    roles: Joi.array().items(Joi.string()).required(),
    given_name: Joi.string().optional(),
    family_name: Joi.string().optional(),
    picture: Joi.string().optional()
}).unknown();


