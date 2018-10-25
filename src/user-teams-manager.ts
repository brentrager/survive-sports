// tslint:disable:quotemark
import LabelledLogger from './labelled-logger';
import { PlayersManager } from './players-manager';
import { UserTeams, UserTeamsModel, PlayersByPosition, PlayersById } from './models/league';

const logger = new LabelledLogger('UserTeamsManager');

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
}