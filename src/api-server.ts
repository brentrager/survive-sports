import * as hapi from 'hapi';
import { PlayersManager } from './players-manager';
import { Logger } from 'winston';
import LabelledLogger from './labelled-logger';

export class ApiServer {
    private logger: LabelledLogger;

    private server = new hapi.Server({
        port: 3000,
        host: 'localhost'
    });

    constructor(logger: Logger, private playersManager: PlayersManager) {
        this.logger = new LabelledLogger(logger, 'ApiServer');
        this.logger.info(this.playersManager);
    }

    async start() {
        await this.server.start();
        this.logger.info(`Listening on ${this.server.settings.port as string}`);
    }
}