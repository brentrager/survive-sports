// tslint:disable:quotemark
import * as hapi from 'hapi';
import * as path from 'path';
import * as inert from 'inert';
import * as jwt from 'hapi-auth-jwt2';
import * as jwksRsa from 'jwks-rsa';
import { AuthenticationClient } from 'auth0';
import { PlayersManager, PlayersByPosition } from './players-manager';
import { Logger } from 'winston';
import LabelledLogger from './labelled-logger';

async function validateUser(decoded: any, request: hapi.Request): Promise<any> {
    // This is a simple check that the `sub` claim
    // exists in the access token. Modify it to suit
    // the needs of your application
    if (decoded && decoded.sub) {
        return { isValid: true };
    }

    return { isValid: false };
}

export class ApiServer {
    private logger: LabelledLogger;
    private playersByPosition: PlayersByPosition;
    private auth0: AuthenticationClient;

    private server = new hapi.Server({
        port: 3000,
        routes: {
            files: {
                relativeTo: path.join(__dirname, '../web-app/dist')
            }
        }
    });

    constructor(logger: Logger, private playersManager: PlayersManager) {
        this.logger = new LabelledLogger(logger, 'ApiServer');

        this.playersManager.playersByPosition().subscribe(playersByPosition => {
            this.playersByPosition = playersByPosition as PlayersByPosition;
        });

        this.auth0 = new AuthenticationClient({
            domain: 'https://hard-g.auth0.com',
            clientId: 'rzCwuye9LrsiDmwdjI84CNiBgS7rcsty'
        });
    }

    async start(): Promise<void> {
        await this.server.register(jwt);
        await this.server.register(inert);

        this.server.auth.strategy('jwt', 'jwt', {
            complete: true,
            key: jwksRsa.hapiJwt2KeyAsync({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'https://hard-g.auth0.com/.well-known/jwks.json'
            }),
            verifyOptions: {
                audience: 'rzCwuye9LrsiDmwdjI84CNiBgS7rcsty',
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
            path: '/api/user',
            handler: async (req, res) => {
                const prof = await this.auth0.getProfile((req.auth as any).token);

                return prof;
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
                    listing: false,
                    index: ['index.html']
                }
            }
        });

        // return index.html for everything else
        this.server.ext('onPreResponse', (request, h) => {
            const response = request.response as any;
            if (response && response.isBoom && response.output && response.output.statusCode === 404) {
                return h.file('index.html');
            }

            return h.continue;
        });

        await this.server.start();

        this.logger.info(`Listening on ${this.server.settings.port as string}`);
    }
}
