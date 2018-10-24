/* tslint:disable:variable-name */
import * as mongoose from 'mongoose';

export interface UserTeam {
    week: number;
    QB: string;
    RB: Array<string>;
    WR: Array<string>;
    TE: string;
    K: string;
    DST: string;
}
export interface UserTeams {
    userId: string;
    teams: Array<UserTeam>;
}

export const UserTeamsSchema = new mongoose.Schema({
    userId: String,
    teams: [
        {
            week: Number,
            QB: String,
            RB: [String],
            WR: [String],
            TE: String,
            K: String,
            DST: String
        }
    ]
});

export const UserTeamsModel = mongoose.model('userTeams', UserTeamsSchema);