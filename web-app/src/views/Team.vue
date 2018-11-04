<template>
    <div class="team container" v-if="authenticated">
        <div class="row">
            <div class="col-sm-12 col-md-6 col-lg-6 mx-auto">
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
                                    <td v-if="!player.expired">
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
                                        <td>{{ player.name }}</td>
                                        <td>{{ player.team }}</td>
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
        };
    }

    public newSelection() {
        const formResultsSet = new Set(this.formResults);
        this.isDirty = (!formResultsSet.has('') && this.currentTeam && !_.isEqual(this.formResults, this.currentTeam.team.map((player) => player.id))) as boolean;
        this.currentlySelectedSubject.next(new Set(this.formResults));
    }

    public async saveTeam() {
        try {
            this.isDirty = false;

            await authService.request('PUT', '/api/user/team', TEAM_COMPOSITION.map((position, index) => {
                return { position: position, id: this.formResults[index] } as Player;
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