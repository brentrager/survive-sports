// tslint:disable:quotemark
import * as hapi from 'hapi';
import * as Boom from 'boom';
import * as path from 'path';
import * as inert from 'inert';
import * as jwt from 'hapi-auth-jwt2';
import * as jwksRsa from 'jwks-rsa';
import { AuthenticationClient } from 'auth0';
import { PlayersManager } from './players-manager';
import LabelledLogger from './labelled-logger';
import { User, UserModel } from './models/user';
import * as _ from 'lodash';
import { UserTeamsModel, UserTeams, PlayersByPosition, POSITIONS, TeamPayloadSchema, Player } from './models/league';
import { UserTeamsManager } from './user-teams-manager';
import weekService from './week-service';
import * as Joi from 'joi';

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

    constructor(private playersManager: PlayersManager, private userTeamsManager: UserTeamsManager) {
        this.logger = new LabelledLogger('ApiServer');

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
            path: '/api/user/players',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                const playerIdSetForUser = await this.userTeamsManager.getPlayerIdSetForUser(user.id);

                if (playerIdSetForUser) {
                    const players = _.clone(this.playersByPosition);
                    const currentWeek = weekService.currentWeek();

                    for (const position of POSITIONS) {
                        players[position] = players[position].filter(player => {
                            return !this.userTeamsManager.isPlayerExpiredInThisWeek(player, currentWeek) && !playerIdSetForUser.has(player.id);
                        });
                    }

                    return players;
                } else {
                    throw Boom.notFound('teams for user not found');
                }
            },
            options: {
                auth: 'jwt'
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/user/teams',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                const userTeams = await this.userTeamsManager.getTeamsForUser(user.id);

                if (userTeams) {
                    return userTeams;
                } else {
                    throw Boom.notFound('teams for user not found');
                }
            },
            options: {
                auth: 'jwt'
            }
        });

        this.server.route({
            method: 'PUT',
            path: '/api/user/team',
            handler: async (req, h) => {
                const week = req.params.week;

                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                try {
                    const userTeam = await this.userTeamsManager.setUserTeamForCurrentWeek(user.id, req.payload as Array<Player>);
                } catch (error) {
                    this.logger.error(`Error in PUT /api/user/team: ${error}`);
                }

                if (userTeams) {
                    return userTeams;
                } else {
                    throw Boom.notFound('teams for user not found');
                }
            },
            options: {
                auth: 'jwt',
                validate: {
                    payload: TeamPayloadSchema
                }
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/teams',
            handler: async (req, h) => {
                const usersTeams = await this.userTeamsManager.getTeams(true, true);

                if (usersTeams) {
                    return usersTeams;
                } else {
                    throw Boom.notFound('teams not found');
                }
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/admin/teams',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                const roles = new Set(user.roles);
                if (!roles.has('admin')) {
                    throw Boom.unauthorized('user is not an admin');
                }

                const usersTeams = await this.userTeamsManager.getTeams(false, false);

                if (usersTeams) {
                    return usersTeams;
                } else {
                    throw Boom.notFound('teams not found');
                }
            },
            options: {
                auth: 'jwt'
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/user',
            handler: async (req, h) => {
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

                let foundUser = await ApiServer.getUser(creds);

                if (foundUser) {
                    if (user.name !== foundUser.name || user.email !== foundUser.email || !_.isEqual(user.roles, foundUser.roles)
                        || user.family_name !== foundUser.family_name || user.given_name !== foundUser.given_name
                        || user.picture !== foundUser.picture) {
                        foundUser.name = user.name;
                        foundUser.email = user.email;
                        foundUser.roles = user.roles;
                        foundUser.family_name = user.family_name;
                        foundUser.given_name = user.given_name;
                        foundUser.picture = user.picture;
                        await UserModel.replaceOne({ id: user.id }, foundUser).exec();
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
                    foundUser = (await newUser.save()).toObject();
                }

                return foundUser;
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

    private static async getUser(creds: any): Promise<User | undefined> {
        let user: User | undefined;

        if (creds && creds.sub) {
            const userId = creds.sub;

            const userDoc = await UserModel.findOne({ id: userId }).exec();

            if (userDoc) {
                user = userDoc.toObject() as User;
            }
        }

        return user;
    }
}
