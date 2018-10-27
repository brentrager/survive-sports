/* tslint:disable:variable-name */
import * as mongoose from 'mongoose';
import { User } from './user';

export const POSITIONS = [
    'QB',
    'RB',
    'WR',
    'TE',
    'K',
    'DST'
];

export interface Ranking {
    ranking: number;
    name: string;
    team: string;
    opp: string;
    gameTime: string;
}

export interface RankingByPosition {
    [position: string]: Ranking;
}

export interface Player {
    id: string;
    position: string;
    name?: string;
    team?: string;
    ranking?: RankingByPosition;
}

export interface Rankings {
    QB: Array<Ranking>;
    RB: Array<Ranking>;
    WR: Array<Ranking>;
    TE: Array<Ranking>;
    K: Array<Ranking>;
    DST: Array<Ranking>;
    timestamp: string;
    _id: any;
    [position: string]: Ranking | string | any;
}

export interface Players {
    timestamp: number;
    player: Array<Player>;
    _id: any;
}

export interface PlayersById {
    [id: string]: Player;
}

export interface PlayersByPosition {
    [position: string]: Array<Player>;
}

export interface UserTeam {
    week: number;
    team: Array<Player>;
}

export interface UserTeams {
    userId: string;
    user?: User;
    teams: Array<UserTeam>;
}

export const UserTeamsSchema = new mongoose.Schema({
    userId: String,
    teams: [
        {
            week: Number,
            team: [
                {
                    position: String,
                    id: String
                }
            ]
        }
    ]
});

export const UserTeamsModel = mongoose.model('userTeams', UserTeamsSchema);