<template>
    <div class="rules">
        <h1>Survive March Madness 2019</h1>
        <p>$25 per entry.</p>
        <p>Pay on <a href="https://www.leaguesafe.com/join/3894693/survive-march-madness-2019">LeagueSafe</a></p>
        <p>Payments are due by Noon Eastern on Friday, March 22nd. After that I'll remove unpaid entries.</p>
        <p>You can only pick a team once.</p>
        <p>One team from each region in round 1.</p>
        <p>One team from two regions in round 2.</p>
        <p>One team from any region for every round after that.</p>
        <p>Make your selection(s) for each round before all games tip that day.</p>
        <p>If any of your teams lose, you're out.</p>
        <p>Winner takes all.</p>
        <p>Tie breaker is the higest seed chosen in any round, after that, ties will occur, and the pot will be split.</p>
        <p class="email">E-mail <a href="mailto:brent.rager@gmail.com">brent.rager@gmail.com</a> with any issues or questions.</p>
        <p v-if="authenticated">Make your selections.</p>
        <p v-else><a href="#" @click.prevent="authService.login()">Sign-In</a> to get started.</p>

        <march-madness-results-component></march-madness-results-component>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as log from 'loglevel';
import authService from '../services/AuthService';
import MarchMadnessResultsComponent from '../components/MarchMadnessResultsComponent.vue';

@Component({
    components: {
        MarchMadnessResultsComponent
    }
})
export default class MarchMadnessRules extends Vue {
    public authenticated = false;

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        return {
            authService,
            authenticated: this.authenticated
        };
    }
}
</script>

<style lang="scss" scoped>
p#email {
    display: inline;
}
</style>
