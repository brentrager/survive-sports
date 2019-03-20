<template>
    <div class="picks" v-if="authenticated">
        <h1>Picks</h1>
        <div v-if="!hasGameStarted">
            <button type="button" class="btn btn-primary" @click="addEntry">Add Entry</button>
        </div>
        <div v-for="(pick, index) of computedPicks" v-bind:key="index">
            <march-madness-picks-component
                v-bind:picks="pick"
                v-bind:picksIndex="index"
                v-bind:removeEntry="removeEntry"
                v-bind:saveEntry="saveEntry"></march-madness-picks-component>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as log from 'loglevel';
import authService from '../services/AuthService';
import marchMadnessRoundService from '../services/MarchMadnessRoundService';
import { Picks, ChoiceList, Choices } from '@/models/march-madness';
import MarchMadnessPicksComponent from '../components/MarchMadnessPicksComponent.vue';


@Component({
    components: {
        MarchMadnessPicksComponent
    },
})
export default class MarchMadnessPicks extends Vue {
    public authenticated = false;
    public picks: Array<Picks> = [];
    public choices: Array<ChoiceList> = [];

    get computedPicks() {
        return this.picks;
    }

    private data() {
        authService.authenticatedSubject.subscribe((authenticated) => {
            this.authenticated = authenticated;
        });
        return {
            authService,
            authenticated: this.authenticated,
            hasGameStarted: marchMadnessRoundService.hasGameStarted(),
            picks: this.picks,
            choices: this.choices
        };
    }

    private created() {
        this.start();
    }

    private async start() {
        try {
            const response = await authService.request('GET', '/api/march-madness/user/picks');
            this.picks = response.data;
        } catch (error) {
            log.error(`Error getting March Madness user picks: ${error}`);
        }
    }

    private async addEntry() {
        try {
            const response = await authService.request('POST', '/api/march-madness/user/picks');
            this.picks = response.data;
        } catch (error) {
            log.error(`Error adding March Madness user picks: ${error}`);
        }
    }

    private async removeEntry(index: number) {
        try {
            const response = await authService.request('DELETE', `/api/march-madness/user/picks/${index}`);
            this.picks = response.data;
            this.$forceUpdate();
        } catch (error) {
            log.error(`Error removing March Madness user picks: ${error}`);
        }
    }

    private async saveEntry(index: number, choices: Choices) {
        try {
            const response = await authService.request('PUT', `/api/march-madness/user/picks/${index}`, choices);
            this.picks = response.data;
            this.$forceUpdate();
        } catch (error) {
            log.error(`Error saving March Madness user picks: ${error}`);
            throw error;
        }
    }
}
</script>
