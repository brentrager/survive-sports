<template>
    <div class="team container">
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
import { UserTeams } from '../models/league';
import * as log from 'loglevel';
import TeamCard from '../components/TeamCard.vue';

@Component({
    components: {
        TeamCard,
    },
})
export default class Team extends Vue {
    private teams: UserTeams | undefined;

    private created() {
        this.start();
    }

    private data() {
        return {
            teams: this.teams,
        };
    }

    private async start() {
        try {
            const response = await authService.request('GET', '/api/user/teams');
            this.teams = response.data;
            if (this.teams) {
                this.teams.teams = this.teams.teams.reverse();
            }
        } catch (error) {
            log.warn(`Error getting user teams: ${error}`);
        }
    }
}
</script>