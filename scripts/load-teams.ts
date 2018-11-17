/* tslint:disable:cyclomatic-complexity */
import { MongoClient } from 'mongodb';
import * as mongoose from 'mongoose';
import { UserTeamsModel, UserTeams, UserTeam, PlayersByPosition, Player, POSITIONS } from '../src/models/league';
import { UserModel, User } from '../src/models/user';
import { PlayersManager } from '../src/players-manager';
import LabelledLogger from '../src/labelled-logger';
import { MFL } from '../src/mfl';
import { FantasyPros } from '../src/fantasy-pros';
import * as fuzz from 'fuzzball';
import * as _ from 'lodash';

const logger = new LabelledLogger('LoadTeams');

function removePlayerById(id: string, players: Array<Player>): Array<Player> {
    return players.filter((player) => {
        return player.id !== id;
    });
}

function getPlayersByPosition(players: Array<Player>, position: string): Array<Player> {
    return players.filter(value => value.position === position);
}

(async () => {
    const dbName = 'survive-sports';
    const url = `mongodb://${process.env.DEV_MODE ? 'localhost' : 'survive-sports-mongo'}:27017`;

    // Connect mongoose
    await mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useCreateIndex: true } as any);
    const mongooseConnection = mongoose.connection;
    logger.info('Connected to mongoose');
    mongooseConnection.on('error', error => {
        logger.error(`Mongoose connection error: ${error}`);
    });

    // Connect mongoClient
    const mongoClient = await MongoClient.connect(url, { useNewUrlParser: true });
    logger.info('Connected to mongodb');

    const db = mongoClient.db(dbName);

    const mfl = new MFL();
    const fantasyPros = new FantasyPros();
    const playersManager = new PlayersManager(db, mfl, fantasyPros);
    await playersManager.update();
    const playersByPosition = playersManager.playersByPosition().getValue() as PlayersByPosition;

    await UserTeamsModel.deleteMany({}).exec();

    // Now load teams
    const teams = [
        {
            name: 'Brent Rager',
            teams: [
                [
                    { pos: 'QB', player: 'ANDY DALTON' },
                    { pos: 'RB', player: 'JOE MIXON' },
                    { pos: 'RB', player: 'JAMES CONNER' },
                    { pos: 'WR', player: 'AJ GREEN' },
                    { pos: 'WR', player: 'JOHN BROWN' },
                    { pos: 'WR', player: 'Chris Hogan' },
                    { pos: 'TE', player: 'DELANOE WALKER' },
                    { pos: 'K', player: 'JUSTIN TUCKER' },
                    { pos: 'DST', player: 'RAVENS' }
                ],
                [
                    { pos: 'QB', player: 'ALEX SMITH' },
                    { pos: 'RB', player: 'CHRIS THOMPSON' },
                    { pos: 'RB', player: 'TJ YELDON' },
                    { pos: 'WR', player: 'JUJU SMITH-SCHUSTER' },
                    { pos: 'WR', player: 'DANTE PETTIS' },
                    { pos: 'WR', player: 'JULIO JONES' },
                    { pos: 'TE', player: 'JORDAN REED' },
                    { pos: 'K', player: 'DUSTIN HOPKINS' },
                    { pos: 'DST', player: 'CHARGERS' }
                ],
                [
                    { pos: 'QB', player: 'PATRICK MALHOMES' },
                    { pos: 'RB', player: 'Latavius Murray' },
                    { pos: 'RB', player: 'Giovani BERNARD' },
                    { pos: 'WR', player: 'WILL FULLER' },
                    { pos: 'WR', player: 'ANTONIO BROWN' },
                    { pos: 'WR', player: 'TYREEK HILL' },
                    { pos: 'TE', player: 'TRAVIS KELCE' },
                    { pos: 'K', player: 'JAKE ELLIOTT' },
                    { pos: 'DST', player: 'VIKINGS' }
                ],
                [
                    { pos: 'QB', player: 'Philip Rivers' },
                    { pos: 'RB', player: 'Tevin Coleman' },
                    { pos: 'RB', player: 'Alvin Kamara' },
                    { pos: 'WR', player: 'Odell Beckham Jr' },
                    { pos: 'WR', player: 'Michael Thomas' },
                    { pos: 'WR', player: 'Keenan Allen' },
                    { pos: 'TE', player: 'Eric Ebron' },
                    { pos: 'K', player: 'Fairbairn' },
                    { pos: 'DST', player: 'Jacksonville' }
                ],
                [
                    { pos: 'QB', player: 'Ben Roethlisbeger' },
                    { pos: 'RB', player: 'David Johnson' },
                    { pos: 'RB', player: 'Christian McCaffrey' },
                    { pos: 'WR', player: 'Adam Thielen' },
                    { pos: 'WR', player: 'Brandin Cooks' },
                    { pos: 'WR', player: 'Corey Davis' },
                    { pos: 'TE', player: 'Jared Cook' },
                    { pos: 'K', player: 'Matt Bryant' },
                    { pos: 'DST', player: 'Tennessee' }
                ],
                [
                    { pos: 'QB', player: 'Tom Brady' },
                    { pos: 'RB', player: 'Sony Michel' },
                    { pos: 'RB', player: 'Melvin Gordon' },
                    { pos: 'WR', player: 'Chester Rogers' },
                    { pos: 'WR', player: 'Mike Evans' },
                    { pos: 'WR', player: 'Josh Gordon' },
                    { pos: 'TE', player: 'Rob Gronkowski' },
                    { pos: 'K', player: 'Gostkowski' },
                    { pos: 'DST', player: 'Chicago Bears' }
                ],
                [
                    { pos: 'QB', player: 'Matt Ryan' },
                    { pos: 'RB', player: 'Philip Lindsay' },
                    { pos: 'RB', player: 'Todd Gurley' },
                    { pos: 'WR', player: 'DeAndre Hopkins' },
                    { pos: 'WR', player: 'Emmanuel Sanders' },
                    { pos: 'WR', player: 'Robert Woods' },
                    { pos: 'TE', player: 'Ricky Seals-Jones' },
                    { pos: 'K', player: 'Harrison Butker' },
                    { pos: 'DST', player: 'Indianapolis Colts' }
                ],
                [
                    { pos: 'QB', player: 'Aaron Rodgers' },
                    { pos: 'RB', player: 'Kareem Hunt' },
                    { pos: 'RB', player: 'Saquon Barkley' },
                    { pos: 'WR', player: 'Davante Adams' },
                    { pos: 'WR', player: 'Stefon Diggs' },
                    { pos: 'WR', player: 'Jarvis Landry' },
                    { pos: 'TE', player: 'George Kittle' },
                    { pos: 'K', player: 'Greg Zuerlein' },
                    { pos: 'DST', player: 'New England Patriots' }
                ],
                [
                    { pos: 'QB', player: 'Cam Newton' },
                    { pos: 'RB', player: 'Ezekiel Elliot' },
                    { pos: 'RB', player: 'James White' },
                    { pos: 'WR', player: 'Julian Edelman' },
                    { pos: 'WR', player: 'Kenny Golladay' },
                    { pos: 'WR', player: 'Cooper Kupp' },
                    { pos: 'TE', player: 'O.J.Howard' },
                    { pos: 'K', player: 'Wil Lutz' },
                    { pos: 'DST', player: 'Dallas Cowboys' }
                ],
                [
                    { pos: 'QB', player: 'Drew Brees' },
                    { pos: 'RB', player: 'Leonard Fournette' },
                    { pos: 'RB', player: 'Aaron Jones' },
                    { pos: 'WR', player: 'Alshon Jeffrey' },
                    { pos: 'WR', player: 'Larry Fitzgerald' },
                    { pos: 'WR', player: 'Amari Cooper' },
                    { pos: 'TE', player: 'Greg Olsen' },
                    { pos: 'K', player: 'Graham Gano' },
                    { pos: 'DST', player: 'Arizona Cardinals' }
                ]
            ]
        }
    ];

    for (const team of teams) {
        const userName = team.name;
        const userTeamsData = team.teams;
        let week = 1;

        const userDoc = await UserModel.findOne({ name: userName });

        if (userDoc) {
            const userTeams = {} as UserTeams;
            userTeams.userId = userDoc.get('id');
            userTeams.teams = [];

            for (const userTeamData of userTeamsData) {
                const userTeam = {} as UserTeam;
                userTeam.week = week;
                userTeam.team = [];

                for (const player of userTeamData) {
                    const pos = player.pos;
                    const playerName = player.player;

                    const playersOfPosition = playersByPosition[pos];

                    let foundPlayer: Player | undefined;
                    for (const mflPlayer of playersOfPosition) {
                        if (mflPlayer.name && fuzz.partial_ratio(playerName, mflPlayer.name) > 85) {
                            foundPlayer = mflPlayer;
                            break;
                        }
                    }

                    if (!foundPlayer) {
                        logger.info(`Unable to match ${playerName}`);
                    } else {
                        logger.info(`Matched ${playerName} to ${foundPlayer.name}`);

                        const playerToAdd: Player = {
                            id: foundPlayer.id,
                            position: pos
                        };
                        userTeam.team.push(playerToAdd);
                    }
                }

                userTeams.teams.push(userTeam);

                week++;
            }

            const userTeamModel = new UserTeamsModel(userTeams);
            const userTeamDoc = await userTeamModel.save();
        }
    }

    const userTeamsDocs = await UserTeamsModel.find({});

    if (userTeamsDocs) {
        for (const userTeamsDoc of userTeamsDocs) {
            const userTeamsJson = userTeamsDoc.toObject() as UserTeams;

            const userId = userTeamsJson.userId;
            const userDoc = await UserModel.findOne({ id: userId });

            if (userDoc) {
                const userJson = userDoc.toObject() as User;
                logger.info(`Printing Rankings for ${userJson.name}`);
                const myPlayersByPosition = _.clone(playersByPosition);

                const myTeams = userTeamsJson.teams;

                for (const team of myTeams) {
                    for (const position of Array.from(POSITIONS)) {
                        for (const playerInPosition of getPlayersByPosition(team.team, position)) {
                            myPlayersByPosition[position] = removePlayerById(playerInPosition.id, myPlayersByPosition[position]);
                        }
                    }
                }

                for (const pos of POSITIONS) {
                    logger.info(`Printing rankings for ${pos}`);
                    logger.info(JSON.stringify(myPlayersByPosition[pos].slice(0, 30).map(x => x.name), null, 4));
                }
            }
        }
    }

    await mongoClient.close();
    await mongoose.disconnect();
})();