/* tslint:disable:variable-name max-line-length */
import axios from 'axios';
import * as moment from 'moment';
import LabelledLogger from './labelled-logger';
import * as Joi from 'joi';

const MAP_MFL_POSITIONS_TO_STANDARD: any = {
    QB: 'QB',
    RB: 'RB',
    WR: 'WR',
    TE: 'TE',
    Def: 'DST',
    PK: 'K'
};

export interface Players {
    timestamp: string | number;
    player: Array<{
        id: string;
        position: string;
        name: string;
    }>;
}

const PlayersSchema = Joi.object().keys({
    timestamp: Joi.string().regex(/^\d+$/),
    player: Joi.array().items(Joi.object().keys({
        id: Joi.string(),
        position: Joi.string(),
        name: Joi.string()
    }).unknown())
}).unknown();

interface ByeWeek {
    bye_week: number;
    id: string;
}

interface ByeWeeks {
    team: Array<ByeWeek>;
}

const ByeWeeksSchema = Joi.object().keys({
    team: Joi.array().items(Joi.object().keys({
        id: Joi.string(),
        bye_week: Joi.string().regex(/^\d+$/)
    }))
}).unknown();

interface Schedule {
    matchup: Array<
        {
            kickoff: string;
            team: Array<
                {
                    id: string;
                    passOffenseRank: string;
                    rushOffenseRank: string;
                    passDefenseRank: string;
                    rushDefenseRank: string;
                    isHome: string;
                    spread: string;
                }
            >
        }
    >;
}

const ScheduleSchema = Joi.object().keys({
    matchup: Joi.array().items(Joi.object().keys({
        kickoff: Joi.string().regex(/^\d+$/),
        team: Joi.array().length(2).items(Joi.object().keys({
            id: Joi.string(),
            passOffenseRank: Joi.string().regex(/^\d+$/),
            rushOffenseRank: Joi.string().regex(/^\d+$/),
            passDefenseRank: Joi.string().regex(/^\d+$/),
            rushDefenseRank: Joi.string().regex(/^\d+$/),
            isHome: Joi.string().regex(/^1|0$/),
            spread: Joi.string().regex(/^[\d\.\-]+$/),
        }).unknown())
    }).unknown())
}).unknown();

export interface ByeWeeksByTeam {
    [id: string]: number;
}

interface TeamWeek {
    id: string;
    passOffenseRank: string;
    rushOffenseRank: string;
    passDefenseRank: string;
    rushDefenseRank: string;
    isHome: string;
    spread: string;
    kickoff: string;
}

interface TeamMatchup {
    team: TeamWeek;
    opponent: TeamWeek;
}

export interface TeamSchedulesByTeam {
    [id: string]: TeamMatchup;
}

export class MFL {
    private logger: LabelledLogger;

    constructor() {
        this.logger = new LabelledLogger('MFL');
    }

    async getPlayers(since?: moment.Moment): Promise<Players | undefined> {
        try {
            const year = moment().format('YYYY');
            const url = since ? `https://www70.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1&SINCE=${Math.floor(since.valueOf() / 1000)}`
                : `https://www70.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
            const response = await axios.get(url);
            if (!response.data.error) {
                const data = await PlayersSchema.validate(response.data.players) as Players;
                const timestamp = moment(data.timestamp as number * 1000).tz('America/New_York');
                data.timestamp = timestamp.format();

                for (const player of data.player) {
                    player.position = player.position in MAP_MFL_POSITIONS_TO_STANDARD ? MAP_MFL_POSITIONS_TO_STANDARD[player.position] : player.position;
                    player.name = player.name.split(', ').reverse().join(' ');
                }

                return data as Players;
            } else {
                this.logger.error(`Error getting player update: ${response.data.error}`);

                return undefined;
            }
        }
        catch (error) {
            this.logger.error(`Error getting players: ${error}`);
            throw error;
        }
    }

    async getByeWeeks(): Promise<ByeWeeksByTeam | undefined> {
        try {
            const year = moment().format('YYYY');
            const url = `https://www72.myfantasyleague.com/${year}/export?TYPE=nflByeWeeks&W=&JSON=1`;
            const response = await axios.get(url);
            if (!response.data.error) {
                const data = await ByeWeeksSchema.validate(response.data.nflByeWeeks) as ByeWeeks;

                const byeWeeksByTeam: ByeWeeksByTeam = {};
                for (const byeWeek of data.team) {
                    byeWeeksByTeam[byeWeek.id] = byeWeek.bye_week;
                }

                return byeWeeksByTeam;
            } else {
                this.logger.error(`Error getting bye weeks: ${response.data.error}`);

                return undefined;
            }
        }
        catch (error) {
            this.logger.error(`Error getting bye weeks: ${error}`);
            throw error;
        }
    }

    async getTeamSchedules(): Promise<TeamSchedulesByTeam | undefined> {
        try {
            const year = moment().format('YYYY');
            const url = `https://www70.myfantasyleague.com/${year}/export?TYPE=nflSchedule&W=&JSON=1`;
            const response = await axios.get(url);
            if (!response.data.error) {
                const data = await ScheduleSchema.validate(response.data.nflSchedule) as Schedule;

                const teamSchedulesByTeam: TeamSchedulesByTeam = {};
                for (const matchup of data.matchup) {
                    const kickoff = moment(parseInt(matchup.kickoff, 10) * 1000).tz('America/New_York');
                    const team1 = matchup.team[0];
                    const team2 = matchup.team[1];

                }

                return byeWeeksByTeam;
            } else {
                this.logger.error(`Error getting bye weeks: ${response.data.error}`);

                return undefined;
            }
        }
        catch (error) {
            this.logger.error(`Error getting bye weeks: ${error}`);
            throw error;
        }
    }
}