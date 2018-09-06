import { Logger } from 'winston';

export default class LabelledLogger {
    private label: string = '';
    constructor(private logger: Logger, label: string) {
        this.label = label;
    }

    info(msg: any): void {
        this.logger.info(`${this.label}: ${msg}`);
    }

    warn(msg: any): void {
        this.logger.warn(`${this.label}: ${msg}`);
    }

    error(msg: any): void {
        this.logger.error(`${this.label}: ${msg}`);
    }

    verbose(msg: any): void {
        this.logger.verbose(`${this.label}: ${msg}`);
    }
}