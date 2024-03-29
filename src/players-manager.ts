// tslint:disable:quotemark
import { Db, Collection } from 'mongodb';
import * as mflTypes from './mfl';
import * as fantasyProsTypes from './fantasy-pros';
import * as moment from 'moment';
// tslint:disable-next-line:import-blacklist
import { BehaviorSubject } from 'rxjs';
import LabelledLogger from './labelled-logger';
import * as fuzz from 'fuzzball';
import { Rankings, Players, PlayersById, PlayersByPosition, Player, Ranking, POSITIONS } from './models/league';

const POSITIONS_SET = new Set(POSITIONS);

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

    playersById(): BehaviorSubject<PlayersById | undefined> {
        return this.playersByIdSubject;
    }

    constructor(private db: Db, private mfl: mflTypes.MFL, private fantasyPros: fantasyProsTypes.FantasyPros) {
        this.logger = new LabelledLogger('PlayersManager');
        this.collectionPlayers = this.db.collection('players');
        this.collectionRankings = this.db.collection('rankings');

        this.playersSubject.subscribe(players => {
            if (players) {
                this.playersByIdSubject.next(players.player.reduce((result: PlayersById, player: Player) => {
                    result[player.id] = player;

                    return result;
                }, {} as PlayersById));

                const playersByPosition = players.player.reduce((result: PlayersByPosition, player: Player) => {
                    if ('position' in player && POSITIONS_SET.has(player.position)) {
                        if (!(player.position in result)) {
                            result[player.position] = [];
                        }
                        result[player.position].push(player);
                    }

                    return result;
                }, {} as PlayersByPosition);

                for (const position in playersByPosition) {
                    if (playersByPosition.hasOwnProperty(position)) {
                        playersByPosition[position] = playersByPosition[position].sort((a, b) => {
                            const ranka = a.ranking && position in a.ranking ? a.ranking[position].ranking : Number.MAX_SAFE_INTEGER;
                            const rankb = b.ranking && position in b.ranking ? b.ranking[position].ranking : Number.MAX_SAFE_INTEGER;

                            return ranka - rankb;
                        });
                    }
                }

                this.playersByPositionSubject.next(playersByPosition);
            }
        });
    }

    nameException(name: string): string {
        const exceptions: any = {
            'mike badgley': 'michael badgley',
            'michael badgley': 'michael badgley'
        };

        return name in exceptions ? exceptions[name] : name;
    }

    async updateRankings(force: boolean = false): Promise<void> {
        try {
            this.logger.info('Updating Fantasy Pros rankings in db.');

            const docs = await this.collectionRankings.findOne({});
            let mongoRankings: Rankings | undefined;
            if (docs) {
                mongoRankings = docs;
            }

            let getNewPlayers = true;
            if (mongoRankings) {
                const timestamp = moment(mongoRankings.timestamp);
                const hoursAgo = moment().diff(timestamp, 'hours');

                getNewPlayers = hoursAgo >= 1;
            }

            if (getNewPlayers || force) {
                const fpRankings = await this.fantasyPros.getPprRankings();

                if (mongoRankings) {
                    this.logger.info(`Replaced rankings in db.`);
                    const result = await this.collectionRankings.replaceOne({ _id: mongoRankings._id }, fpRankings);
                    this.rankingsSubject.next(result.ops[0]);
                } else {
                    this.logger.info(`Inserted rankings in db.`);
                    const result = await this.collectionRankings.insertOne(fpRankings);
                    this.rankingsSubject.next(result.ops[0]);
                }

                this.logger.info('Updating MFL players with rankings in db.');

                const playersDocs = await this.collectionPlayers.findOne({});

                if (playersDocs) {
                    const players: Players = playersDocs;

                    await this.updateTeamSchedules(players);

                    for (const player of players.player) {
                        player.ranking = {};
                    }

                    const rankings: Rankings = this.rankingsSubject.getValue() as Rankings;

                    for (const rankingsPosition of POSITIONS) {
                        this.logger.info(`Updating rankings for position: ${rankingsPosition}`);
                        for (const rankingAny of rankings[rankingsPosition]) {
                            const ranking = rankingAny as Ranking;
                            const player = players.player.find(thisPlayer => {
                                if (thisPlayer.team !== ranking.team) {
                                    if (thisPlayer.team && !thisPlayer.team.startsWith(ranking.team)) {
                                        return false;
                                    }
                                }
                                if (rankingsPosition === 'DST' && thisPlayer.position !== 'DST') {
                                    return false;
                                }

                                if (!thisPlayer.name) {
                                    return false;
                                }

                                let nameMatch1 = true;
                                const playerName = this.nameException(thisPlayer.name.toLocaleLowerCase().replace('.', ''));
                                const rankingName = this.nameException(ranking.name.toLocaleLowerCase().replace('.', ''));
                                const playerNameArray = playerName.split(' ');
                                const rankingNameArray = rankingName.split(' ');
                                for (let i = 0; i < Math.min(playerNameArray.length, rankingNameArray.length); i++) {
                                    const name1 = playerNameArray[i];
                                    const name2 = rankingNameArray[i];
                                    if (!(name1 === name2 || name1.startsWith(name2) || name2.startsWith(name1))) {
                                        nameMatch1 = false;
                                        break;
                                    }
                                }

                                if (!nameMatch1) {
                                    // Last try, fuzzy matching
                                    const ratio = fuzz.partial_ratio(playerName, rankingName);

                                    if (ratio < 90) {
                                        return false;
                                    } else {
                                        this.logger.info(`Fuzzy matched '${playerName}' and '${rankingName}'`);
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

    async updateByeWeeks(players: Players): Promise<void> {
        const byeWeeksByTeam = await this.mfl.getByeWeeks();

        if (byeWeeksByTeam) {
            for (const player of players.player) {
                if (player.byeWeek) {
                    delete player.byeWeek;
                }

                if (player.team && player.team in byeWeeksByTeam) {
                    player.byeWeek = byeWeeksByTeam[player.team];
                }
            }

            this.logger.info('Updated player bye weeks.');
        }
    }

    async updateTeamSchedules(players: Players): Promise<void> {
        const teamSchedulesByTeam = await this.mfl.getTeamSchedules();

        if (teamSchedulesByTeam) {
            for (const player of players.player) {
                if (player.matchup) {
                    delete player.matchup;
                }

                if (player.team) {
                    player.matchup = teamSchedulesByTeam[player.team];
                }
            }

            this.logger.info('Updated player schedules.');
        }
    }

    async updateInjuries(players: Players): Promise<void> {
        const injuriesByPlayer = await this.mfl.getInjuries();

        if (injuriesByPlayer) {
            for (const player of players.player) {
                if (player.injury) {
                    delete player.injury;
                }

                if (player.id in injuriesByPlayer) {
                    const playerInjury = injuriesByPlayer[player.id];
                    player.injury = {
                        status: playerInjury.status,
                        details: playerInjury.details
                    };
                }
            }

            this.logger.info('Updated player injuries.');
        }
    }

    async update(): Promise<void> {
        try {
            this.logger.info('Updating MFL players in db.');

            const docs = await this.collectionPlayers.find({}).toArray();
            let players: Players | undefined;
            if (docs.length) {
                players = docs[0];
            }

            let getNewPlayers = true;
            let since: moment.Moment | undefined;
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

            let forceUpdateRankings = false;
            if (getNewPlayers) {
                const mflPlayers = await this.mfl.getPlayers(since);

                if (mflPlayers) {
                    if (since) {
                        const mongoPlayers = players as Players;
                        for (const mflPlayer of mflPlayers.player) {
                            const index = mongoPlayers.player.findIndex(x => x.id === mflPlayer.id);
                            if (index >= 0) {
                                mongoPlayers.player[index] = mflPlayer as Player;
                            } else {
                                mongoPlayers.player.push(mflPlayer as Player);
                            }
                        }

                        mongoPlayers.timestamp = mflPlayers.timestamp as number;

                        await this.updateByeWeeks(mongoPlayers);
                        await this.updateInjuries(mongoPlayers);

                        this.logger.info(`Updated ${mflPlayers.player.length} players in db since ${since}.`);
                        const result = await this.collectionPlayers.replaceOne({ _id: mongoPlayers._id }, mongoPlayers);
                        this.playersSubject.next(result.ops[0]);
                        forceUpdateRankings = true;
                    } else {
                        await this.updateByeWeeks(mflPlayers as Players);
                        await this.updateInjuries(mflPlayers as Players);

                        this.logger.info(`Inserted ${mflPlayers.player.length} players in db.`);
                        const result = await this.collectionPlayers.insertOne(mflPlayers);
                        this.playersSubject.next(result.ops[0]);
                        forceUpdateRankings = true;
                    }
                } else if (players) {
                    this.logger.info('Unable to update players, returning current players.');
                    this.playersSubject.next(players as Players);
                }
            } else {
                this.logger.info('Returning current players.');
                this.playersSubject.next(players as Players);
            }

            await this.updateRankings(forceUpdateRankings);
        } catch (error) {
            this.logger.error(`Error updating player manager: ${error}`);
            console.error(error);
        }

        setTimeout(async () => {
            await this.update();
        }, 1000 * 60 * 60 * 24);
    }
}