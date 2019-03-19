// tslint:disable:quotemark variable-name max-line-length
import * as hapi from 'hapi';
import * as Boom from 'boom';
import * as path from 'path';
import * as inert from 'inert';
import * as jwt from 'hapi-auth-jwt2';
import * as jwksRsa from 'jwks-rsa';
import { AuthenticationClient } from 'auth0';
import { PlayersManager } from './players-manager';
import LabelledLogger from './labelled-logger';
import { User, UserModel, UserSchema } from './models/user';
import * as _ from 'lodash';
import { UserTeamsModel, UserTeams, PlayersByPosition, POSITIONS, TeamPayloadSchema, Player, PlayersByPositionSchema, UserTeamSchema, UserTeamsSchema, UserTeam } from './models/league';
import { UserTeamsManager } from './user-teams-manager';
import weekService from './week-service';
import * as Joi from 'joi';
import { MarchMadnessManager } from './march-madness-manager';
import { ResultsSchema, PicksSchema, ChoiceSchema, ChoicesSchema, Choices, ChoiceListSchema, PicksArraySchema } from './models/march-madness';

const APP_METADATA = 'https://survive-sports.com/app_metadata';
const USER_METADATA = 'https://survive-sports.com/user_metadata';

const BoomErrorSchema = Joi.object().keys({
    statusCode: Joi.number().required(),
    error: Joi.string().required(),
    message: Joi.string().optional()
});

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

    constructor(private playersManager: PlayersManager, private userTeamsManager: UserTeamsManager, private marchMadnessManager: MarchMadnessManager) {
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

        this.server.ext('onRequest', (request, h) => {
            this.logger.info(`Request: ${request.path} - Payload: ${request.payload ? JSON.stringify(request.payload) : 'None'}`);

            return h.continue;
        });

        const onPayloadValidationFailure = async (request: hapi.Request, h: hapi.ResponseToolkit, error: Error) => {
            this.logger.error(`Request payload validation failure for ${request.path}: ${error}`);
            throw Boom.badRequest('request payload validation failed');
        };

        const onResponseValidationFailure = async (request: hapi.Request, h: hapi.ResponseToolkit, error: Error) => {
            this.logger.error(`Response validation failure for ${request.path}: ${error}`);
            throw Boom.internal('response validation failed');
        };

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

                const availablePlayersForUser = this.userTeamsManager.getAvailablePlayersForUser(user.id);

                if (availablePlayersForUser) {
                    return availablePlayersForUser;
                } else {
                    throw Boom.notFound('teams for user not found');
                }
            },
            options: {
                auth: 'jwt',
                response: {
                    status: {
                        200: PlayersByPositionSchema.required(),
                        401: BoomErrorSchema,
                        404: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
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
                auth: 'jwt',
                response: {
                    status: {
                        200: UserTeamsSchema.required(),
                        401: BoomErrorSchema,
                        404: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
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

                let userTeam: UserTeam | undefined;

                try {
                    userTeam = await this.userTeamsManager.setUserTeamForCurrentWeek(user.id, req.payload as Array<Player>);
                } catch (error) {
                    this.logger.error(`Error in PUT /api/user/team: ${error}`);
                    throw Boom.badRequest((error as Error).message);
                }

                if (userTeam) {
                    return userTeam;
                } else {
                    throw Boom.badRequest('could not set team');
                }
            },
            options: {
                auth: 'jwt',
                validate: {
                    payload: TeamPayloadSchema,
                    failAction: onPayloadValidationFailure
                },
                response: {
                    status: {
                        200: UserTeamSchema.required(),
                        400: BoomErrorSchema,
                        401: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
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
            },
            options: {
                response: {
                    status: {
                        200: Joi.array().items(UserTeamsSchema).required(),
                        404: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
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
                auth: 'jwt',
                response: {
                    status: {
                        200: UserTeamSchema.required(),
                        401: BoomErrorSchema,
                        404: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
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
                auth: 'jwt',
                response: {
                    status: {
                        200: UserSchema.required(),
                        401: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/march-madness/user/choices',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                const choiceList = await this.marchMadnessManager.getUserChoices(user);

                return choiceList;
            },
            options: {
                auth: 'jwt',
                response: {
                    status: {
                        200: Joi.array().items(ChoiceListSchema).required(),
                        401: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/march-madness/results',
            handler: async (req, h) => {
                const results = await this.marchMadnessManager.getResults();

                return results;
            },
            options: {
                response: {
                    status: {
                        200: ResultsSchema.required(),
                    },
                    failAction: onResponseValidationFailure
                }
            }
        });

        this.server.route({
            method: 'GET',
            path: '/api/march-madness/user/picks',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                const picks = await this.marchMadnessManager.getPicksByUser(user);

                return picks;
            },
            options: {
                auth: 'jwt',
                response: {
                    status: {
                        200: PicksArraySchema.required(),
                        401: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
            }
        });

        this.server.route({
            method: 'PUT',
            path: '/api/march-madness/user/picks',
            handler: async (req, h) => {
                const creds = (req.auth.credentials as any).payload!;
                const user = await ApiServer.getUser(creds);

                if (!user) {
                    throw Boom.unauthorized('user does not exist');
                }

                let userTeam: UserTeam | undefined;

                try {
                    const picks = await this.marchMadnessManager.setPickForUser(user, req.payload as Array<Choices>);

                    return picks;
                } catch (error) {
                    this.logger.error(`Error in PUT /api/user/team: ${error}`);
                    throw Boom.badRequest((error as Error).message);
                }
            },
            options: {
                auth: 'jwt',
                validate: {
                    payload: Joi.array().items(ChoicesSchema).required(),
                    failAction: onPayloadValidationFailure
                },
                response: {
                    status: {
                        200: PicksArraySchema.required(),
                        400: BoomErrorSchema,
                        401: BoomErrorSchema
                    },
                    failAction: onResponseValidationFailure
                }
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
            if (!request.path.startsWith('/api/') && response && response.isBoom && response.output && response.output.statusCode === 404) {
                return h.file('index.html');
            }

            if (response.isBoom) {
                const responseBoom: Boom = response;
                this.logger.info(`Response for ${request.path}: ${responseBoom.output.statusCode} - ${JSON.stringify(responseBoom.output.payload)}`);
            } else {
                const responseHapi: hapi.ResponseObject = response;
                this.logger.info(`Response for ${request.path}: ${responseHapi.statusCode}`);
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
