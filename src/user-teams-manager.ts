// tslint:disable:quotemark
import LabelledLogger from './labelled-logger';
import { PlayersManager } from './players-manager';
import { UserTeams, UserTeamsModel, PlayersByPosition, PlayersById, Player, UserTeam, POSITIONS } from './models/league';
import { UserModel, User } from './models/user';
import weekService from './week-service';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { filter } from 'bluebird';

const logger = new LabelledLogger('UserTeamsManager');

const SCRUBBED = 'SCRUBBED';

export class UserTeamsManager {
    private playersById: PlayersById | undefined;
    private playersByPosition: PlayersByPosition | undefined;

    constructor(private playersManager: PlayersManager) {
        this.playersManager.playersById().subscribe(playersById => {
            this.playersById = playersById;
        });

        this.playersManager.playersByPosition().subscribe(playersByPosition => {
            this.playersByPosition = playersByPosition;
        });
    }

    async getTeamsForUser(userId: string): Promise<UserTeams | undefined> {
        let userTeams: UserTeams | undefined;
        const currentWeek = weekService.currentWeek();

        if (this.playersById) {
            const userTeamsDoc = await UserTeamsModel.findOne({ userId }).exec();

            if (userTeamsDoc) {
                userTeams = userTeamsDoc.toObject() as UserTeams;

                for (const userTeam of userTeams.teams) {
                    userTeam.team = userTeam.team.map(player => {
                        const thisPlayer = _.clone((this.playersById as PlayersById)[player.id]);

                        if (userTeam.week === currentWeek && this.isPlayerExpiredInThisWeek(thisPlayer, currentWeek)) {
                            thisPlayer.expired = true;
                        }

                        return thisPlayer;
                    });
                }
            }
        }

        return userTeams;
    }

    async getPlayerIdSetForUser(userId: string, includeCurrentWeek: boolean = false): Promise<Set<string> | undefined> {
        let playerIdSetForUser: Set<string> | undefined;

        const currentWeek = weekService.currentWeek();

        const userTeams = await this.getTeamsForUser(userId);

        if (userTeams) {
            playerIdSetForUser = userTeams.teams.reduce((result, userTeam) => {
                if (includeCurrentWeek || (!includeCurrentWeek && userTeam.week !== currentWeek)) {
                    for (const teamPlayer of userTeam.team) {
                        result.add(teamPlayer.id);
                    }
                }

                return result;
            }, new Set());
        }

        return playerIdSetForUser;
    }

    isPlayerExpiredInThisWeek(player: Player, week: number): boolean {
        // If it's for this week and the game is in the past, make the player blank.
        if (player && player.ranking && player.position in player.ranking) {
            const rank = player.ranking[player.position];
            const gameTime = moment(rank.gameTime).tz('America/New_York');

            if (weekService.getWeekFromDate(gameTime) === week
                && gameTime > moment().tz('America/New_York')) {
                return true;
            }
        }

        return false;
    }

    async getAvailablePlayersForUser(userId: string): Promise<PlayersByPosition | undefined> {
        let availablePlayersForUser: PlayersByPosition | undefined;

        const playerIdSetForUser = await this.getPlayerIdSetForUser(userId);

        if (playerIdSetForUser && this.playersByPosition) {
            availablePlayersForUser = _.clone(this.playersByPosition);
            const currentWeek = weekService.currentWeek();

            for (const position of POSITIONS) {
                availablePlayersForUser[position] = availablePlayersForUser[position].filter(player => {
                    return !this.isPlayerExpiredInThisWeek(player, currentWeek) && !playerIdSetForUser.has(player.id);
                });
            }

        }

        return availablePlayersForUser;
    }

    async setUserTeamForCurrentWeek(userId: string, team: Array<Player>): Promise<UserTeam | undefined> {
        let userTeamForCurrentWeek: UserTeam | undefined;

        const currentWeek = weekService.currentWeek();
        const userTeams = await this.getTeamsForUser(userId);

        if (userTeams) {
            const userTeam = userTeams.teams.find(thisTeam => thisTeam.week === currentWeek);

            if (userTeam) {
                // First, our existing team may have expired players. Those can't change.
                const existingTeamRequiredPlayerIdSet = new Set(userTeam.team.filter(player => {
                    return this.isPlayerExpiredInThisWeek(player, currentWeek);
                }).map(player => player.id));
                const newTeamPlayerIdSet = new Set(team.map(player => player.id));

                for (const playerId of existingTeamRequiredPlayerIdSet) {
                    if (!newTeamPlayerIdSet.has(playerId)) {
                        throw new Error('a player that cannot be changed was not included');
                    }
                }
            }
        }

        return userTeamForCurrentWeek;
    }

    /**
     *
     * @param scrub Remove sensitive User information.
     * @param filterExpiredPlayers Filter out expired players.
     */
    async getTeams(scrub: boolean, filterExpiredPlayers: boolean): Promise<Array<UserTeams> | undefined> {
        let userTeamsList: Array<UserTeams> | undefined;
        const currentWeek = weekService.currentWeek();

        if (this.playersById) {
            const userTeamsListDoc = await UserTeamsModel.find({}).exec();
            const usersDoc = await UserModel.find({}).exec();

            if (userTeamsListDoc && usersDoc) {
                userTeamsList = userTeamsListDoc.map(x => x.toObject() as UserTeams);

                const usersById = usersDoc.reduce((result, userDoc) => {
                    const user: User = userDoc.toObject();
                    const userId = user.id;

                    if (scrub) {
                        user.id = SCRUBBED;
                        user.email = SCRUBBED;
                        user.roles = [];
                    }

                    result[userId] = user;

                    return result;
                }, {} as any);

                userTeamsList = userTeamsList.map(userTeams => {
                    userTeams.user = usersById[userTeams.userId];

                    if (scrub) {
                        userTeams.userId = SCRUBBED;
                    }

                    if (filterExpiredPlayers) {
                        for (const userTeam of userTeams.teams) {
                            userTeam.team = userTeam.team.map(player => {
                                const actualPlayer = _.clone((this.playersById as PlayersById)[player.id]);

                                if (this.isPlayerExpiredInThisWeek(actualPlayer, userTeam.week)) {
                                    actualPlayer.name = '';
                                    actualPlayer.id = '';
                                    actualPlayer.team = '';
                                    actualPlayer.ranking = {};
                                }

                                return actualPlayer;
                            });
                        }
                    }

                    return userTeams;
                });
            }
        }

        return userTeamsList;
    }
}