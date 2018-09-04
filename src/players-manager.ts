import { Db, Collection } from 'mongodb';
import * as mfl from './mfl';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { Logger } from 'winston';

export interface Player {
    id: string;
    position: string;
    name: string;
    team: string;
}

export interface Players {
    timestamp: number;
    player: Array<Player>;
    _id: any;
}

export interface PlayersById {
    [id: string]: Player
}

export interface PlayersByPosition {
    [position: string]: Array<Player>
}

export class PlayersManager {
    private collection: Collection;
    playersSubject: BehaviorSubject<Players | undefined> = new BehaviorSubject(undefined);
    playersByIdSubject: BehaviorSubject<PlayersById | undefined> = new BehaviorSubject(undefined);
    playersByPositionSubject: BehaviorSubject<PlayersByPosition | undefined> = new BehaviorSubject(undefined);

    constructor(private logger: Logger, private db: Db, private mfl: mfl.MFL) {
        this.collection = this.db.collection('players');

        this.playersSubject.subscribe(players => {
            if (players) {
                this.playersByIdSubject.next(players.player.reduce((result: PlayersById, player: Player) => {
                    result[player.id] = player;
                    return result;
                }, {} as PlayersById));

                this.playersByPositionSubject.next(players.player.reduce((result: PlayersByPosition, player: Player) => {
                    if ('position' in player) {
                        if (!(player.position in result)) {
                            result[player.position] = [];
                        }
                        result[player.position].push(player);
                    }
                    return result;
                }, {} as PlayersByPosition))
            }
        });
    }

    async update() {
        try {
            this.logger.info('Updating MFL players in db.');

            const docs = await this.collection.find({}).toArray();
            let players: Players | undefined;
            if (docs.length) {
                players = docs[0];
            }

            let getNewPlayers = true;
            let since: moment.Moment | undefined = undefined;
            if (players) {
                const timestamp = moment(players.timestamp);
                const hoursAgo = moment(moment().diff(timestamp)).hours();

                if (hoursAgo >= 24) {
                    getNewPlayers = true;
                    since = timestamp;
                } else {
                    getNewPlayers = false;
                }
            }

            if (getNewPlayers) {
                const mflPlayers = await this.mfl.getPlayers(since);

                if (mflPlayers) {
                    if (since) {
                        const mongoPlayers = players as Players;
                        for (const mflPlayer of mflPlayers.player) {
                            const index = mongoPlayers.player.findIndex(x => x.id === mflPlayer.id);
                            if (index >= 0) {
                                mongoPlayers.player[index] = mflPlayer as Player;
                            }
                        }

                        this.logger.info (`Updated ${mflPlayers.player.length} players in db since ${since}.`);
                        const result = await this.collection.update({ _id: mongoPlayers._id }, mongoPlayers);
                        this.playersSubject.next(result.ops[0]);
                    } else {
                        this.logger.info(`Inserted ${mflPlayers.player.length} players in db.`);
                        const result = await this.collection.insert(mflPlayers);
                        this.playersSubject.next(result.ops[0]);
                    }
                } else if (players) {
                    this.logger.info('Unable to update players, returning current players.');
                    this.playersSubject.next(players as Players);
                }
            } else {
                this.logger.info('Returning current players.');
                this.playersSubject.next(players as Players);
            }
        } catch (error) {
            this.logger.error(`Error updating player manager: ${error}`);
            console.error(error);
        }

        setTimeout(async () => {
            await this.update();
        }, 1000 * 60 * 60 * 24);
    }
}