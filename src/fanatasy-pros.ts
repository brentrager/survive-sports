import { Logger } from 'winston';
import LabelledLogger from './labelled-logger';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as moment from 'moment';

const URLS_BY_POSITION: any = {
    QB: 'https://www.fantasypros.com/nfl/rankings/qb.php',
    RB: 'https://www.fantasypros.com/nfl/rankings/ppr-rb.php',
    WR: 'https://www.fantasypros.com/nfl/rankings/ppr-wr.php',
    TE: 'https://www.fantasypros.com/nfl/rankings/ppr-te.php',
    K: 'https://www.fantasypros.com/nfl/rankings/k.php',
    DST: 'https://www.fantasypros.com/nfl/rankings/dst.php'
};

export interface Ranking {
    ranking: number;
    name: string;
    team: string;
    opp: string;
    gameTime: string;
}

export interface Rankings {
    QB: Ranking;
    RB: Ranking;
    WR: Ranking;
    TE: Ranking;
    K: Ranking;
    DST: Ranking;
    timestamp: string;
}

export class FantasyPros {
    private logger: LabelledLogger;

    constructor(logger: Logger) {
        this.logger = new LabelledLogger(logger, 'FantasyPros');
    }

    async getPprRankings(): Promise<Rankings> {
        try {
            const rankings = {} as Rankings;
            for (const position in URLS_BY_POSITION) {
                if (URLS_BY_POSITION.hasOwnProperty(position)) {
                    (rankings as any)[position] = [];
                    const curRankings = (rankings as any)[position];
                    const url = URLS_BY_POSITION[position];
                    this.logger.info(`Getting rankes from ${url}`);
                    const html = await axios.get(url);
                    const $ = cheerio.load(html.data);

                    $('input.wsis[type=checkbox]').each((_index, element) => {
                        const ranking = {
                            ranking: parseInt(element.parent.parent.firstChild.firstChild.nodeValue, 10),
                            name: element.attribs['data-name'],
                            team: element.attribs['data-team'],
                            opp: element.attribs['data-opp'].trim(),
                            gameTime: moment(element.attribs['data-kickoff'], 'MM/DD hh:mm a').format()
                        };

                        curRankings.push(ranking);
                    });
                }
            }

            rankings.timestamp = moment().format();

            return rankings;
        } catch (error) {
            this.logger.error(`Error loading rankings: ${error}`);
            throw error;
        }
    }
}