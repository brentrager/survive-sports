// tslint:disable:quotemark
import LabelledLogger from './labelled-logger';
import { PlayersManager } from './players-manager';
import { UserTeams, UserTeamsModel, PlayersByPosition, PlayersById } from './models/league';
import { UserModel, User } from './models/user';

const logger = new LabelledLogger('UserTeamsManager');

const SCRUBBED = 'SCRUBBED';

export class UserTeamsManager {
    private playersById: PlayersById | undefined;

    constructor(private playersManager: PlayersManager) {
        this.playersManager.playersById().subscribe(playersById => {
            this.playersById = playersById;
        });
    }

    async getTeamsForUser(userId: string): Promise<UserTeams | undefined> {
        let userTeams: UserTeams | undefined;

        if (this.playersById) {
            const userTeamsDoc = await UserTeamsModel.findOne({ userId }).exec();

            if (userTeamsDoc) {
                userTeams = userTeamsDoc.toObject() as UserTeams;

                for (const userTeam of userTeams.teams) {
                    userTeam.team = userTeam.team.map(player => (this.playersById as PlayersById)[player.id]);
                }
            }
        }

        return userTeams;
    }

    /**
     *
     * @param scrub Remove sensitive User information.
     */
    async getTeams(scrub: boolean): Promise<Array<UserTeams> | undefined> {
        let userTeamsList: Array<UserTeams> | undefined;

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

                    for (const userTeam of userTeams.teams) {
                        userTeam.team = userTeam.team.map(player => (this.playersById as PlayersById)[player.id]);
                    }

                    return userTeams;
                });
            }
        }

        return userTeamsList;
    }
}