/* tslint:disable:variable-name */
import * as mongoose from 'mongoose';
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
});

export const UserMongooseSchema = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
    email: String,
    name: String,
    roles: [String],
    given_name: {
        type: String,
        required: false
    },
    family_name: {
        type: String,
        required: false
    },
    picture: {
        type: String,
        required: false
    }
});

export const UserModel = mongoose.model('user', UserMongooseSchema);