<template>
    <div class="team container" v-if="authenticated">
        <div class="row">
            <div class="team-selection col-sm-12 col-md-6 col-lg-6 mx-auto">
                <div class="team-card card mt-4">
                    <div class="card-header">
                        <h4 class="d-inline-block align-middle">
                            Week {{ currentWeek }}
                        </h4>
                    </div>
                    <div class="card-body" v-if="currentTeam && playersByPositionSubject && currentlySelectedSubject">
                        <table class="table table-sm">
                            <tbody>
                                <tr v-for="(player, index) of currentTeam.team" v-if="player" v-bind:key="index">
                                    <th scope="row">
                                        {{ player.position }}
                                        </th>
                                    <td v-if="!player.expired" colspan="2">
                                        <player-select
                                            :position="player.position"
                                            :selected="player.id"
                                            :playersByPositionSubject="playersByPositionSubject"
                                            :currentlySelectedSubject="currentlySelectedSubject"
                                            :formResults="formResults"
                                            :formResultsIndex="index"
                                            v-on:selected="newSelection()"></player-select>
                                    </td>
                                    <template v-if="player.expired">
                                        <td collspan="2" v-html="displayPlayer(player)"></td>
                                    </template>
                                </tr>
                            </tbody>
                        </table>
                        <div class="text-center">
                            <button class="btn btn-banner" :disabled="!isDirty" @click="saveTeam()">Save Team</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="teams">
            <div class="col-sm-12 col-md-6 col-lg-4" v-for="team in teams.teams" :key="team.week">
                <team-card v-bind:header="`Week ${team.week}`" v-bind:team="team.team"></team-card>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
// tslint:disable:max-line-length

import { Component, Vue, Watch } from 'vue-property-decorator';
import authService from '../services/AuthService';
import { UserTeams, UserTeam, PlayersByPosition, Player } from '../models/league';
import * as log from 'loglevel';
import TeamCard from '../components/TeamCard.vue';
import weekService from '../services/WeekService';
import PlayerSelect from '../components/PlayerSelect.vue';
import { BehaviorSubject } from 'rxjs';
import moment from 'moment-timezone';
import * as _ from 'lodash';

export const TEAM_COMPOSITION = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'K', 'DST'];

@Component({
    components: {
        TeamCard,
        PlayerSelect
    },
})
export default class Team extends Vue {
    private authenticated = false;
    private teams: UserTeams | undefined;
    private currentWeek: number = 0;
    private currentTeam: UserTeam | undefined;
    private playersByPositionSubject!: BehaviorSubject<PlayersByPosition | undefined>;
    private currentlySelectedSubject!: BehaviorSubject<Set<string>>;
    private formResults!: Array<string>;
    private isDirty!: boolean;

    public created() {
        this.start();
    }

    public data() {
        this.isDirty = false;
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        this.currentWeek = weekService.currentWeek();
        this.currentlySelectedSubject = new BehaviorSubject(new Set());
        this.playersByPositionSubject = new BehaviorSubject<PlayersByPosition | undefined>(undefined);
        this.formResults = TEAM_COMPOSITION.map((x) => '');
        return {
            teams: this.teams,
            authenticated: this.authenticated,
            currentWeek: this.currentWeek,
            currentTeam: this.currentTeam,
            playersByPositionSubject: this.playersByPositionSubject,
            currentlySelectedSubject: this.currentlySelectedSubject,
            formResults: this.formResults,
            isDirty: this.isDirty,
            displayPlayer: this.displayPlayer
        };
    }

    public displayPlayer(player: Player) {
        const ranking = player.ranking && player.position in player.ranking && player.ranking[player.position];
        const rankingNumber = ranking ? ranking.ranking : '';
        let gameOpp = '';
        let gameTime = '';
        let injuryStatus = '';
        if (player.matchup) {
            gameOpp = `${player.matchup.opponent.isHome ? '@' : ''}${player.matchup.opponent.id}`;
            let gameOppColor = 'rgba(72, 77, 109, 1)';

            if (player.position === 'QB' || player.position === 'TE' || player.position === 'WR' || player.position === 'DST') {
                if (player.matchup.opponent.passDefenseRank <= 10) {
                    gameOppColor = '#dc3545';
                } else if (player.matchup.opponent.passDefenseRank > 20) {
                    gameOppColor = '#28a745';
                }
            } else if (player.position === 'RB') {
                if (player.matchup.opponent.rushDefenseRank <= 10) {
                    gameOppColor = '#dc3545';
                } else if (player.matchup.opponent.rushDefenseRank > 20) {
                    gameOppColor = '#28a745';
                }
            }

            gameOpp = `<strong style="color:${gameOppColor}">${gameOpp}</strong>`;
            gameTime = `${moment(player.matchup.team.kickoff).tz('America/New_York').format('ddd h:mm A')}`;
        }
        if (player.injury) {
            injuryStatus = ` <small style="color:rgba(255, 0, 0, 1)">${player.injury.status}</small>`;
        }
        return `
            <div class="row" style="width:100%;font-size: 90%">
                <div class="col-sm-2"><strong style="color:rgba(239, 100, 97, 1)">${rankingNumber}</strong></div>
                <div class="col-sm-5">${player.name} <small style="color:rgba(8, 178, 227, 1)">${player.team}</small>${injuryStatus}</div>
                <div class="col-sm-2">${gameOpp}</div>
                <div class="col-sm-3"><small>${gameTime}</small></div>
            </div>
        `;
    }

    public newSelection() {
        const formResultsSet = new Set(this.formResults);
        this.isDirty = (!formResultsSet.has('') && this.currentTeam && !_.isEqual(this.formResults, this.currentTeam.team.map((player) => player.id))) as boolean;

        if (!_.isEqual(formResultsSet, this.currentlySelectedSubject.getValue())) {
            this.currentlySelectedSubject.next(new Set(this.formResults));
        }
    }

    public async saveTeam() {
        try {
            this.isDirty = false;

            await authService.request('PUT', '/api/user/team', TEAM_COMPOSITION.map((position, index) => {
                return { position, id: this.formResults[index] } as Player;
            }));

            await this.start();
        } catch (error) {
            log.error(`Error saving team: ${error}`);
        }
    }

    private async start() {
        try {
            const response = await authService.request('GET', '/api/user/teams');
            const teams: UserTeams = response.data;
            if (teams) {
                teams.teams = teams.teams.reverse();

                if (teams.teams.length && teams.teams[0].week === this.currentWeek) {
                    this.currentTeam = teams.teams.shift();
                }

                if (!this.currentTeam) {
                    this.currentTeam = {
                        week: this.currentWeek,
                        team: TEAM_COMPOSITION.map((pos) => {
                            return {
                                position: pos,
                                id: '',
                            };
                        }),
                    };
                }

                this.formResults = this.currentTeam.team.map((x) => x.id);

                if (this.currentlySelectedSubject) {
                    this.currentlySelectedSubject.next(new Set(this.currentTeam.team.filter((player) => player.id !== '').map((player) => player.id)));
                }

                this.teams = teams;
            }

            const playersResponse = await authService.request('GET', '/api/user/players');
            const playersByPosition: PlayersByPosition = playersResponse.data;
            if (this.playersByPositionSubject && playersByPosition) {
                this.playersByPositionSubject.next(playersByPosition);
            }


        } catch (error) {
            log.warn(`Error getting user teams: ${error}`);
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
