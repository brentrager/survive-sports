/* tslint:disable:max-line-length */
import * as Moment from 'moment-timezone';
import { RoundSchema } from '@/models/march-madness';
const moment = Moment;

interface Round {
    roundOf: number;
    start: Moment.Moment;
}

class MarchMadnessRoundService {
    private rounds: Array<Round> = [
        { roundOf: 64, start: moment.tz('2019-03-21 12:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
        { roundOf: 32, start: moment.tz('2019-03-23 12:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
        { roundOf: 16, start: moment.tz('2019-03-28 7:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
        { roundOf: 8, start: moment.tz('2019-03-30 6:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
        { roundOf: 4, start: moment.tz('2019-04-06 6:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
        { roundOf: 2, start: moment.tz('2019-04-08 9:00 PM', 'YYYY-MM-DD hh:mm a', 'America/New_York')},
    ];
    private roundsMap: Map<number, Moment.Moment> = new Map();

    constructor() {
        this.roundsMap = this.rounds.reduce((result, value) => {
            result.set(value.roundOf, value.start);
            return result;
        }, new Map());
    }

    /**
     * Returns the current available round.
     */
    public availableRound(): number {
        for (const round of this.rounds) {
            // logger.info(`Time: ${moment.tz('America/New_York')} - ${round.start} - ${round.roundOf}`);
            if (moment.tz('America/New_York').isBefore(round.start)) {
                return round.roundOf;
            }
        }

        return 64;
    }

    public viewableRound(): number {
        for (const round of this.rounds.slice().reverse()) {
            if (moment.tz('America/New_York').isSameOrAfter(round.start)) {
                return round.roundOf;
            }
        }

        return 0;
    }

    public isViewableRound(round: number) {
        return round >= this.viewableRound();
    }

    public isAvailableRound(round: number) {
        return round <= this.availableRound();
    }

    public hasGameStarted() {
        return !this.isAvailableRound(64);
    }

    public timeForRound(round: number) {
        return this.roundsMap.get(round);
    }
}

const marchMadnessRoundService = new MarchMadnessRoundService();

export default marchMadnessRoundService;
