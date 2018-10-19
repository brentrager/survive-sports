/* tslint:disable:variable-name */
import * as mongoose from 'mongoose';

export interface User {
    id: string;
    email: string;
    name: string;
    roles: Array<string>;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

export const UserSchema = new mongoose.Schema({
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

export const UserModel = mongoose.model('User', UserSchema);