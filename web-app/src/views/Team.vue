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
                    <div class="card-body" v-if="currentTeam">
                        <table class="table table-sm">
                            <tbody>
                                <tr v-for="(player, index) of currentTeam.team" v-if="player" v-bind:key="index">
                                    <th scope="row">{{ player.position }}</th>
                                    <td>{{ player.name }}</td>
                                </tr>
                            </tbody>
                        </table>
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
import { Component, Vue } from 'vue-property-decorator';
import authService from '../services/AuthService';
import { UserTeams, UserTeam } from '../models/league';
import * as log from 'loglevel';
import TeamCard from '../components/TeamCard.vue';
import weekService from '../services/WeekService';
import PlayerSelect from '../components/PlayerSelect.vue';

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

    private created() {
        this.start();
    }

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        this.currentWeek = weekService.currentWeek();
        return {
            teams: this.teams,
            authenticated: this.authenticated,
            currentWeek: this.currentWeek,
            currentTeam: this.currentTeam,
        };
    }

    private async start() {
        try {
            const response = await authService.request('GET', '/api/user/teams');
            const teams = response.data;
            this.teams = response.data;
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

                this.teams = teams;
            }


        } catch (error) {
            log.warn(`Error getting user teams: ${error}`);
        }
    }
}
</script>