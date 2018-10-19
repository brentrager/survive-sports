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
import { User, UserModel } from './models/user';
import * as _ from 'lodash';

const APP_METADATA = 'https://survive-sports.com/app_metadata';
const USER_METADATA = 'https://survive-sports.com/user_metadata';

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
            domain: 'hard-g.auth0.com',
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
                const creds = (req.auth.credentials as any).payload!;
                const user: User = {
                    id: creds.sub,
                    email: creds.email,
                    name: creds.name,
                    roles: (APP_METADATA in creds && 'roles' in creds[APP_METADATA]) ? creds[APP_METADATA].roles : [],
                    family_name: creds.family_name,
                    given_name: creds.given_name,
                    picture: creds.picture
                };

                let userDoc = await UserModel.findOne({ id: user.id }).exec();

                if (userDoc) {
                    if (user.name !== userDoc.get('name') || user.email !== userDoc.get('email') || !_.isEqual(user.roles, userDoc.get('roles'))
                        || user.family_name !== userDoc.get('family_name') || user.given_name !== userDoc.get('given_name')
                        || user.picture !== userDoc.get('picture')) {
                        userDoc.set('name', user.name);
                        userDoc.set('email', user.email);
                        userDoc.set('roles', user.roles);
                        userDoc.set('family_name', user.family_name);
                        userDoc.set('given_name', user.given_name);
                        userDoc.set('picture', user.picture);
                        await UserModel.replaceOne({ id: user.id }, userDoc).exec();
                    }
                } else {
                    const newUser = new UserModel({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        roles: user.roles,
                        family_name: user.family_name,
                        given_name: user.given_name,
                        picture: user.picture
                    });
                    userDoc = await newUser.save();
                }

                return user;
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
