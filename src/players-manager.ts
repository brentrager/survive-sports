import { Db, Collection } from 'mongodb';
import * as mfl from './mfl';
import * as fantasyPros from './fanatasy-pros';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { Logger } from 'winston';
import LabelledLogger from './labelled-logger';

const POSITIONS = [
    'QB',
    'RB',
    'WR',
    'TE',
    'K',
    'DST'
];

export interface Ranking {
    ranking: number;
    name: string;
    team: string;
    opp: string;
    gameTime: string;
}

export interface Rankings {
    QB: Ranking;
    RB: Ranking;
    WR: Ranking;
    TE: Ranking;
    K: Ranking;
    DST: Ranking;
    timestamp: string;
    _id: any;
    [position: string]: Ranking | string | any;
}

export interface RankingByPosition {
    [position: string]: Ranking;
}

export interface Player {
    id: string;
    position: string;
    name: string;
    team: string;
    ranking?: RankingByPosition;
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
    private logger: LabelledLogger;
    private collectionPlayers: Collection;
    private collectionRankings: Collection;
    private rankingsSubject: BehaviorSubject<Rankings | undefined> = new BehaviorSubject(undefined);
    private playersSubject: BehaviorSubject<Players | undefined> = new BehaviorSubject(undefined);
    private playersByIdSubject: BehaviorSubject<PlayersById | undefined> = new BehaviorSubject(undefined);
    private playersByPositionSubject: BehaviorSubject<PlayersByPosition | undefined> = new BehaviorSubject(undefined);

    playersByPosition(): BehaviorSubject<PlayersByPosition | undefined> {
        return this.playersByPositionSubject;
    }

    constructor(logger: Logger, private db: Db, private mfl: mfl.MFL, private fantasyPros: fantasyPros.FantasyPros) {
        this.logger = new LabelledLogger(logger, 'PlayersManager');
        this.collectionPlayers = this.db.collection('players');
        this.collectionRankings = this.db.collection('rankings');

        this.playersSubject.subscribe(players => {
            if (players) {
                this.playersByIdSubject.next(players.player.reduce((result: PlayersById, player: Player) => {
                    result[player.id] = player;
                    return result;
                }, {} as PlayersById));

                const playersByPosition = players.player.reduce((result: PlayersByPosition, player: Player) => {
                    if ('position' in player) {
                        if (!(player.position in result)) {
                            result[player.position] = [];
                        }
                        result[player.position].push(player);
                    }
                    return result;
                }, {} as PlayersByPosition);

                for (const position in playersByPosition) {
                    playersByPosition[position] = playersByPosition[position].sort((a, b) => {
                        const ranka = a.ranking && position in a.ranking ? a.ranking[position].ranking : Number.MAX_SAFE_INTEGER;
                        const rankb = b.ranking && position in b.ranking ? b.ranking[position].ranking : Number.MAX_SAFE_INTEGER;

                        return ranka - rankb;
                    });
                }

                this.playersByPositionSubject.next(playersByPosition);
            }
        });
    }

    async updateRankings() {
        try {
            this.logger.info('Updating Fantasy Pros rankings in db.');

            const docs = await this.collectionRankings.find({}).toArray();
            let rankings: Rankings | undefined;
            if (docs.length) {
                rankings = docs[0];
            }

            let getNewPlayers = true;
            if (rankings) {
                const timestamp = moment(rankings.timestamp);
                const hoursAgo = moment().diff(timestamp, 'hours');

                if (hoursAgo >= 1) {
                    getNewPlayers = true;
                } else {
                    getNewPlayers = false;
                }
            }

            if (getNewPlayers) {
                const fpRankings = await this.fantasyPros.getPprRankings();

                if (rankings) {
                    this.logger.info(`Replaced rankings in db.`);
                    const result = await this.collectionRankings.replaceOne({ _id: rankings._id }, fpRankings);
                    this.rankingsSubject.next(result.ops[0]);
                } else {
                    this.logger.info(`Inserted rankings in db.`);
                    const result = await this.collectionRankings.insertOne(fpRankings);
                    this.rankingsSubject.next(result.ops[0]);
                }

                this.logger.info('Updating MFL players with rankings in db.');

                const playersDocs = await this.collectionPlayers.find({}).toArray();

                if (playersDocs && playersDocs.length) {
                    const players: Players = playersDocs[0];
                    const rankings: Rankings = this.rankingsSubject.getValue() as Rankings;

                    for (const rankingsPosition of POSITIONS) {
                        for (const rankingAny of rankings[rankingsPosition]) {
                            const ranking = rankingAny as Ranking;
                            const player = players.player.find(player => {
                                const playerName = player.name.toLocaleLowerCase().replace('.', '').split(' ');
                                const rankingName = ranking.name.toLocaleLowerCase().replace('.', '').split(' ');
                                for (let i = 0; i < Math.min(playerName.length, rankingName.length); i++) {
                                    const name1 = playerName[i];
                                    const name2 = rankingName[i]
                                    if (!(name1 === name2 || name1.startsWith(name2) || name2.startsWith(name1))) {
                                        return false;
                                    }
                                }
                                return true;
                            });

                            if (!player) {
                                this.logger.warn(`Couldn't match ${ranking.name}`);
                            } else {
                                if (!player.ranking) {
                                    player.ranking = {};
                                }

                                player.ranking[rankingsPosition] = ranking;
                            }
                        }
                    }

                    this.logger.info(`Updated players in db with rankings.`);
                    const result = await this.collectionPlayers.replaceOne({ _id: players._id }, players);
                    this.playersSubject.next(result.ops[0]);
                }
            }
        } catch (error) {
            this.logger.error(`Error updating player manager: ${error}`);
            console.error(error);
        }

        setTimeout(async () => {
            await this.updateRankings();
        }, 1000 * 60 * 60);
    }

    async update() {
        try {
            this.logger.info('Updating MFL players in db.');

            const docs = await this.collectionPlayers.find({}).toArray();
            let players: Players | undefined;
            if (docs.length) {
                players = docs[0];
            }

            let getNewPlayers = true;
            let since: moment.Moment | undefined = undefined;
            if (players) {
                const timestamp = moment(players.timestamp);
                const hoursAgo = moment().diff(timestamp, 'hours');

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

                        this.logger.info(`Updated ${mflPlayers.player.length} players in db since ${since}.`);
                        const result = await this.collectionPlayers.replaceOne({ _id: mongoPlayers._id }, mongoPlayers);
                        this.playersSubject.next(result.ops[0]);
                    } else {
                        this.logger.info(`Inserted ${mflPlayers.player.length} players in db.`);
                        const result = await this.collectionPlayers.insertOne(mflPlayers);
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

            await this.updateRankings();
        } catch (error) {
            this.logger.error(`Error updating player manager: ${error}`);
            console.error(error);
        }

        setTimeout(async () => {
            await this.update();
        }, 1000 * 60 * 60 * 24);
    }
}