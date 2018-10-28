<template>
    <div class="league">
        <h2 class="text-center">
            Teams for Week
            <button type="button" class="btn btn-banner"><i class="fas fa-arrow-left" v-on:click.prevent.stop="lastWeek()"></i></button>
            {{ currentWeek }}
            <button type="button" class="btn btn-banner"><i class="fas fa-arrow-right" v-on:click.prevent.stop="nextWeek()"></i></button>
        </h2>
        <div class="row">
            <div class="col-sm-12 col-md-6 col-lg-4" v-for="userTeam in currentUsersTeams" :key="userTeam.user">
                <team-card v-bind:header="userTeam.user" v-bind:team="userTeam.team" v-bind:picture="userTeam.picture"></team-card>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { UserTeams, Player } from '../models/league';
import axios from 'axios';
import * as log from 'loglevel';
import weekService from '../services/WeekService';
import TeamCard from '../components/TeamCard.vue';

interface CurrentUserTeam {
    user: string;
    picture: string;
    team: Array<Player>;
}

@Component({
    components: {
        TeamCard,
    },
})
export default class League extends Vue {
    private usersTeams: Array<UserTeams> | undefined;
    private currentWeek: number = 1;
    private weeks: Array<any> = [];
    private currentUsersTeams: Array<CurrentUserTeam> = [];

    public getTeamsForWeek(week: number) {
        const newCurrentUsersTeams: Array<CurrentUserTeam> = [];

        if (this.usersTeams) {
            for (const userTeam of this.usersTeams) {
                if (userTeam.user) {
                    const newCurrentUserTeam: CurrentUserTeam = {
                        user: userTeam.user.name,
                        picture: userTeam.user.picture as string,
                        team: [],
                    };

                    const team = userTeam.teams.find((x) => x.week === week);

                    if (team) {
                        newCurrentUserTeam.team = team.team;
                    } else {
                        newCurrentUserTeam.team = [
                            { id: '', position: 'QB', name: '', team: ''},
                            { id: '', position: 'RB', name: '', team: ''},
                            { id: '', position: 'RB', name: '', team: ''},
                            { id: '', position: 'WR', name: '', team: ''},
                            { id: '', position: 'WR', name: '', team: ''},
                            { id: '', position: 'WR', name: '', team: ''},
                            { id: '', position: 'TE', name: '', team: ''},
                            { id: '', position: 'K', name: '', team: ''},
                            { id: '', position: 'DST', name: '', team: ''},
                        ];
                    }

                    newCurrentUsersTeams.push(newCurrentUserTeam);
                }
            }

            newCurrentUsersTeams.sort((a, b) => {
                return a.user.localeCompare(b.user);
            });

            this.currentUsersTeams = newCurrentUsersTeams;
        }
    }

    public lastWeek() {
        this.currentWeek = Math.max(1, this.currentWeek - 1);
        this.getTeamsForWeek(this.currentWeek);
    }

    public nextWeek() {
        this.currentWeek = Math.min(this.weeks.length, this.currentWeek + 1);
        this.getTeamsForWeek(this.currentWeek);
    }

    private created() {
        this.start();
    }

    private data() {
        return {
            usersTeams: this.usersTeams,
            currentWeek: this.currentWeek,
            weeks: weekService.weeks(),
            currentUsersTeams: this.currentUsersTeams,
        };
    }

    private async start() {
        try {
            this.currentWeek = weekService.currentWeek();
            this.weeks = weekService.weeks();
            const response = await axios.get('/api/teams');
            this.usersTeams = response.data;
            this.getTeamsForWeek(this.currentWeek);
        } catch (error) {
            log.warn(`Error getting user teams: ${error}`);
        }
    }
}
</script>
