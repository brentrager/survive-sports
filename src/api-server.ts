// tslint:disable:quotemark
import * as hapi from 'hapi';
import * as path from 'path';
import * as inert from 'inert';
import * as jwt from 'hapi-auth-jwt2';
import * as jwksRsa from 'jwks-rsa';
import { PlayersManager, PlayersByPosition } from './players-manager';
import { Logger } from 'winston';
import LabelledLogger from './labelled-logger';

const validateUser = (decoded: any, request: hapi.Request, callback: Function) => {
    // This is a simple check that the `sub` claim
    // exists in the access token. Modify it to suit
    // the needs of your application
    console.log("Decoded", decoded);
    if (decoded && decoded.sub) {
        return callback(null, true, {});
    }

    return callback(null, false, {});
};

export class ApiServer {
    private logger: LabelledLogger;
    private playersByPosition: PlayersByPosition;

    private server = new hapi.Server({
        port: 3000,
        routes: {
            files: {
                relativeTo: path.join(__dirname, '../static')
            }
        }
    });

    constructor(logger: Logger, private playersManager: PlayersManager) {
        this.logger = new LabelledLogger(logger, 'ApiServer');

        this.playersManager.playersByPosition().subscribe(playersByPosition => {
            this.playersByPosition = playersByPosition as PlayersByPosition;
        });
    }

    async start(): Promise<void> {
        await this.server.register(jwt);
        await this.server.register(inert);
        // see: http://Hapi.com/api#serverauthschemename-scheme
        this.server.auth.strategy('jwt', 'jwt', {
            key: jwksRsa.hapiJwt2Key({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'https://hard-g.auth0.com/.well-known/jwks.json'
            }),
            verifyOptions: {
                audience: 'https://survive-sports.com/api',
                issuer: "https://hard-g.auth0.com/",
                algorithms: ['RS256']
            },
            validate: validateUser
        });

        this.server.route({
            method: 'GET',
            path: '/api/players',
            handler: async (req, res) => {
                return this.playersByPosition;
            },
            options: {
                auth: 'jwt'
            }
        });

        this.server.route({
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: '.',
                    redirectToSlash: true,
                    index: true
                }
            }
        });

        await this.server.start();

        this.logger.info(`Listening on ${this.server.settings.port as string}`);
    }
}
