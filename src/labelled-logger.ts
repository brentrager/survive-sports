import { Logger } from 'winston';

export default class LabelledLogger {
    private label: string = '';
    constructor(private logger: Logger, label: string) {
        this.label = label;
    }

    info(msg: any) {
        this.logger.info(`${this.label}: ${msg}`);
    }

    warn(msg: any) {
        this.logger.warn(`${this.label}: ${msg}`);
    }

    error(msg: any) {
        this.logger.error(`${this.label}: ${msg}`);
    }

    verbose(msg: any) {
        this.logger.verbose(`${this.label}: ${msg}`);
    }
}