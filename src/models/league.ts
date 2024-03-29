/* tslint:disable:variable-name max-line-length */
import * as mongoose from 'mongoose';
import { User, UserSchema } from './user';
import * as Joi from 'joi';
import weekService from '../week-service';

export const POSITIONS = [
    'QB',
    'RB',
    'WR',
    'TE',
    'K',
    'DST'
];

export const TEAM_COMPOSITION = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'K', 'DST'];

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
    gameTime: Joi.string().isoDate().allow(null).required()
}).unknown();

export interface RankingByPosition {
    [position: string]: Ranking;
}

export const RankingByPositionSchema = Joi.object().keys(POSITIONS.reduce((res, pos) => {
    res[pos] = RankingSchema;

    return res;
}, {} as any)).unknown();

export interface TeamWeek {
    id: string;
    passOffenseRank: number;
    rushOffenseRank: number;
    passDefenseRank: number;
    rushDefenseRank: number;
    isHome: boolean;
    spread: number;
    kickoff: string;
}

export const TeamWeekSchema = Joi.object().keys({
    id: Joi.string().required(),
    passOffenseRank: Joi.number().integer().positive().required(),
    rushOffenseRank: Joi.number().integer().positive().required(),
    passDefenseRank: Joi.number().integer().positive().required(),
    rushDefenseRank: Joi.number().integer().positive().required(),
    isHome: Joi.boolean().required(),
    spread: Joi.number().required(),
    kickoff: Joi.string().isoDate().required()
});

export interface TeamMatchup {
    team: TeamWeek;
    opponent: TeamWeek;
}

export const TeamMatchupSchema = Joi.object().keys({
    team: TeamWeekSchema,
    opponent: TeamWeekSchema
});

export interface Injury {
    status: string;
    details: string;
}

export const InjurySchema = Joi.object().keys({
    status: Joi.string().required(),
    details: Joi.string().required()
});

export interface Player {
    id: string;
    position: string;
    name?: string;
    team?: string;
    ranking?: RankingByPosition;
    expired?: boolean;
    byeWeek?: number;
    matchup?: TeamMatchup;
    injury?: Injury;
}

export const PlayerSchema = Joi.object().keys({
    id: Joi.string().allow('').allow(null).required(),
    position: Joi.string().valid(POSITIONS).required(),
    name: Joi.string().allow('').allow(null).optional(),
    team: Joi.string().allow('').allow(null).optional(),
    ranking: RankingByPositionSchema.allow(null).optional(),
    expired: Joi.boolean().allow(null).optional(),
    byeWeek: Joi.number().integer().optional().max(weekService.weeks().length).min(1).allow(null),
    matchup: TeamMatchupSchema.optional().allow(null),
    injury: InjurySchema.optional().allow(null)
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

export const UserTeamsMongooseSchema = new mongoose.Schema({
    userId: {
        type: String,
        index: true,
        unique: true
    },
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

export const UserTeamsModel = mongoose.model('userTeams', UserTeamsMongooseSchema);

export const TeamPayloadSchema = Joi.array().items(PlayerSchema).length(TEAM_COMPOSITION.length).required();
