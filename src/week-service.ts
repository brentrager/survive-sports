/* tslint:disable:max-line-length */
import * as Moment from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
const moment = extendMoment(Moment);

class WeekService {
    private nflWeeks: Array<DateRange> = [
        moment.range(moment('2018-01-01', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-09-11', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-09-11', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-09-18', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-09-18', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-09-25', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-09-25', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-10-02', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-10-02', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-10-09', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-10-09', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-10-16', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-10-16', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-10-23', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-10-23', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-10-30', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-10-30', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-11-06', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-11-06', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-11-13', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-11-13', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-11-20', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-11-20', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-11-27', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-11-27', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-12-04', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-12-04', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-12-11', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-12-11', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-12-18', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-12-18', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-12-25', 'YYYY-MM-DD').tz('America/New_York')),
        moment.range(moment('2018-12-25', 'YYYY-MM-DD').tz('America/New_York'), moment('2018-12-31', 'YYYY-MM-DD').tz('America/New_York'))
    ];

    /**
     * Returns the current NFL week. The maximum this will return is week 17.
     */
    currentWeek(): number {
        let week = 1;
        for (const weekRange of this.nflWeeks) {
            if (weekRange.contains(moment().tz('America/New_York'))) {
                break;
            }
            week++;
        }

        return Math.min(week, this.nflWeeks.length);
    }

    getWeekFromDate(date: Moment.Moment): number {
        let week = 1;
        for (const weekRange of this.nflWeeks) {
            if (weekRange.contains(date)) {
                return week;
            }
            week++;
        }

        return 0;
    }

    weeks(): Array<any> {
        return this.nflWeeks.map((x, index) => {
            return { week: index + 1, weekRange: x };
        });
    }
}

const weekService = new WeekService();

export default weekService;
