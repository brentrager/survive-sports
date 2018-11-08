/* tslint:disable:variable-name max-line-length */
import { User, UserSchema } from './user';
import * as Joi from 'joi';

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

export const RankingSchema = Joi.object().keys({
    ranking: Joi.number().required(),
    name: Joi.string().required(),
    team: Joi.string().required(),
    opp: Joi.string().required(),
    gameTime: Joi.string().required()
}).unknown();

export interface RankingByPosition {
    [position: string]: Ranking;
}

export const RankingByPositionSchema = Joi.object().keys(POSITIONS.reduce((res, pos) => {
    res[pos] = RankingSchema;

    return res;
}, {} as any)).unknown();

export interface Player {
    id: string;
    position: string;
    name?: string;
    team?: string;
    ranking?: RankingByPosition;
    expired?: boolean;
}

export const PlayerSchema = Joi.object().keys({
    id: Joi.string().required(),
    position: Joi.string().valid(POSITIONS).required(),
    name: Joi.string().optional(),
    team: Joi.string().optional(),
    ranking: RankingByPositionSchema.optional(),
    expired: Joi.boolean().optional()
}).unknown();

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

export const PlayersByPositionSchema = Joi.object().keys(POSITIONS.reduce((res, pos) => {
    res[pos] = Joi.array().items(PlayerSchema);

    return res;
}, {} as any)).unknown();

export interface UserTeam {
    week: number;
    team: Array<Player>;
}

export const UserTeamSchema = Joi.object().keys({
    week: Joi.number().required(),
    team: Joi.array().items(PlayerSchema).required()
}).unknown();

export interface UserTeams {
    userId: string;
    user?: User;
    teams: Array<UserTeam>;
}

export const UserTeamsSchema = Joi.object().keys({
    userId: Joi.string().required(),
    user: UserSchema.optional(),
    teams: Joi.array().items(UserTeamSchema).required()
}).unknown();

export const TEAM_COMPOSITION = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'K', 'DST'];

export const TeamPayloadSchema = Joi.array().items(PlayerSchema).length(TEAM_COMPOSITION.length).required();
