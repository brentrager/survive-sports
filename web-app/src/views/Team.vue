<template>
    <div class="team container">
        <div class="row">
            <div class="col-sm-12 col-md-6 col-lg-4" v-for="team in teams.teams" :key="team.week">
                Week {{ team.week }}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import authService from '../services/AuthService';
import { UserTeams } from '../models/league';
import * as log from 'loglevel';

@Component({})
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
            log.info(this.teams);
        } catch (error) {
            log.warn(`Error getting user teams: ${error}`);
        }
    }
}
</script>