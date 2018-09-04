import * as hapi from 'hapi';
import { PlayersManager } from './players-manager';
import { Logger } from 'winston';

export class ApiServer {
    constructor(private logger: Logger, private playersManager: PlayersManager) {
    }

    async start() {

    }
}