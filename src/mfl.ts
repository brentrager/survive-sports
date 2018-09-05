import axios from 'axios';
import { Logger } from 'winston';
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

export class MFL {
    private logger: LabelledLogger;

    constructor(logger: Logger) {
        this.logger = new LabelledLogger(logger, 'MFL');
    }

    async getPlayers(since?: moment.Moment): Promise<Players | undefined> {
        try {
            const url = since ? `https://www70.myfantasyleague.com/2018/export?TYPE=players&DETAILS=1&JSON=1&SINCE=${Math.floor(since.valueOf() / 1000)}`
                : 'https://www70.myfantasyleague.com/2018/export?TYPE=players&DETAILS=1&JSON=1';
            const response = await axios.get(url);
            if (!response.data.error)
            {
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
}