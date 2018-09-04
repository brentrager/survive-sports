import axios from 'axios';
import { Logger } from 'winston';
import * as moment from 'moment';

export interface Players {
    timestamp: number;
    player: Array<{
        id: string;
    }>;

}

export class MFL {
    constructor(private logger: Logger) {
    }

    async getPlayers(since?: moment.Moment): Promise<Players | undefined> {
        try {
            const url = since ? `https://www70.myfantasyleague.com/2018/export?TYPE=players&DETAILS=1&JSON=1&SINCE=${Math.floor(since.valueOf() / 1000)}`
                : 'https://www70.myfantasyleague.com/2018/export?TYPE=players&DETAILS=1&JSON=1';
            const response = await axios.get(url);
            if (!response.data.error)
            {
                const data = response.data.players;
                const timestamp = moment(data.timestamp * 1000);
                data.timestamp = timestamp.toISOString();
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