import * as Moment from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
const moment = extendMoment(Moment);

class WeekService {
    private nflWeeks: Array<DateRange> = [
        moment.range(moment('2018-01-01', 'YYYY-MM-DD'), moment('2018-09-10', 'YYYY-MM-DD')),
        moment.range(moment('2018-09-11', 'YYYY-MM-DD'), moment('2018-09-17', 'YYYY-MM-DD')),
        moment.range(moment('2018-09-18', 'YYYY-MM-DD'), moment('2018-09-24', 'YYYY-MM-DD')),
        moment.range(moment('2018-09-25', 'YYYY-MM-DD'), moment('2018-10-01', 'YYYY-MM-DD')),
        moment.range(moment('2018-10-02', 'YYYY-MM-DD'), moment('2018-10-08', 'YYYY-MM-DD')),
        moment.range(moment('2018-10-09', 'YYYY-MM-DD'), moment('2018-10-15', 'YYYY-MM-DD')),
        moment.range(moment('2018-10-16', 'YYYY-MM-DD'), moment('2018-10-22', 'YYYY-MM-DD')),
        moment.range(moment('2018-10-23', 'YYYY-MM-DD'), moment('2018-10-29', 'YYYY-MM-DD')),
        moment.range(moment('2018-10-30', 'YYYY-MM-DD'), moment('2018-11-05', 'YYYY-MM-DD')),
        moment.range(moment('2018-11-06', 'YYYY-MM-DD'), moment('2018-11-12', 'YYYY-MM-DD')),
        moment.range(moment('2018-11-13', 'YYYY-MM-DD'), moment('2018-11-19', 'YYYY-MM-DD')),
        moment.range(moment('2018-11-20', 'YYYY-MM-DD'), moment('2018-11-26', 'YYYY-MM-DD')),
        moment.range(moment('2018-11-27', 'YYYY-MM-DD'), moment('2018-12-03', 'YYYY-MM-DD')),
        moment.range(moment('2018-12-04', 'YYYY-MM-DD'), moment('2018-12-10', 'YYYY-MM-DD')),
        moment.range(moment('2018-12-11', 'YYYY-MM-DD'), moment('2018-12-17', 'YYYY-MM-DD')),
        moment.range(moment('2018-12-18', 'YYYY-MM-DD'), moment('2018-12-24', 'YYYY-MM-DD')),
        moment.range(moment('2018-12-25', 'YYYY-MM-DD'), moment('2018-12-30', 'YYYY-MM-DD')),
    ];

    /**
     * Returns the current NFL week. The maximum this will return is week 17.
     */
    public currentWeek() {
        let week = 1;
        for (const weekRange of this.nflWeeks) {
            if (weekRange.contains(moment())) {
                break;
            }
            week++;
        }

        return Math.min(week, this.nflWeeks.length);
    }

    public weeks() {
        return this.nflWeeks.map((x, index) => {
            return { week: index + 1, weekRange: x };
        });
    }
}

const weekService = new WeekService();

export default weekService;
