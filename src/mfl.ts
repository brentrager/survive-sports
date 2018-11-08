import axios from 'axios';
import * as moment from 'moment';
import LabelledLogger from './labelled-logger';

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

interface ByeWeek {
    bye_week: number;
    id: string;
}

interface ByeWeeks {
    team: Array<ByeWeek>;
}

export interface ByeWeeksByTeam {
    [id: string]: number;
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
                const data = response.data.players as Players;
                const timestamp = moment(data.timestamp as number * 1000);
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
                const data = response.data.nflByeWeeks as ByeWeeks;

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
}