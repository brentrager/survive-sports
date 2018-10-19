/* tslint:disable:variable-name */
import * as mongoose from 'mongoose';

export const TeamSchema = new mongoose.Schema({
    userId: String,
    week: Number,
    players: {
        qb: String,
        rb: [String],
        wr: [String],
        te: String,
        k: String,
        dst: String
    }
});

export const TeamModel = mongoose.model('Team', TeamSchema);