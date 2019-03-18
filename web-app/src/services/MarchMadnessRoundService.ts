/* tslint:disable:max-line-length */
import * as Moment from 'moment-timezone';
const moment = Moment.default;

interface Round {
    roundOf: number;
    start: Moment.Moment;
}

class MarchMadnessRoundService {
    private rounds: Array<Round> = [
        { roundOf: 64, start: moment('2019-03-21 12:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
        { roundOf: 32, start: moment('2019-03-23 12:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
        { roundOf: 16, start: moment('2019-03-28 7:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
        { roundOf: 8, start: moment('2019-03-30 6:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
        { roundOf: 4, start: moment('2019-04-06 6:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
        { roundOf: 2, start: moment('2019-04-08 9:00 PM', 'YYYY-MM-DD h:mm a').tz('America/New_York')},
    ];

    /**
     * Returns the current NFL week. The maximum this will return is week 17.
     */
    public availableRound() {
        for (const round of this.rounds) {
            if (moment().tz('America/New_York').isBefore(round.start)) {
                return round.roundOf;
            }
        }

        return null;
    }
}

const marchMadnessRoundService = new MarchMadnessRoundService();

export default marchMadnessRoundService;
