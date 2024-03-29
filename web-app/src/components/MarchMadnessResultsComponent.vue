<template>
    <div class="results" v-if="results">
        <h1>Results</h1>
        <table class="table table-striped table-bordered table-responsive-md mt-2" v-if="results.picks && results.picks.length">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Best Round</th>
                    <th scope="col">Tie Breaker</th>
                    <th scope="col">Available Teams</th>
                    <th scope="col" colspan="4" align="center">Round of 64</th>
                    <th scope="col" colspan="2">Round of 32</th>
                    <th scope="col">Round of 16</th>
                    <th scope="col">Round of 8</th>
                    <th scope="col">Round of 4</th>
                    <th scope="col">Round of 2</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(picks, index) of results.picks" v-bind:key="index">
                    <th scope="row" class="thead-dark name" :class="{ 'table-danger': picks.eliminated}">
                        <img v-if="picks.user.picture" :src="picks.user.picture" class="mr-2"/> {{ picks.user.name}}
                    </th>
                    <td :class="{ 'table-danger': picks.eliminated}">{{ picks.bestRound }}</td>
                    <td :class="{ 'table-danger': picks.eliminated}">{{ picks.tieBreaker }}</td>
                    <td :class="{ 'table-danger': picks.eliminated}">{{ picks.availableTeams }}</td>
                    <template v-for="(choices) of picks.choices">
                        <template v-if="isViewableRound(choices.roundOf) && choices.choices && choices.choices.length">
                            <template v-for="(choice, index3) of choices.choices">
                                <td :key="index3" :class="{ 'table-danger': choice.eliminated, 'table-success': wonInThisRound(choice, choices.roundOf) }"><strong style="color:rgba(239, 100, 97, 1)">{{choice.seed}}</strong> {{ choice.team }} <small style="color:rgba(8, 178, 227, 1)">{{choice.region[0].toUpperCase()}}</small></td>
                            </template>
                        </template>
                    </template>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop} from 'vue-property-decorator';
import { Results, Choice } from '../models/march-madness';
import axios from 'axios';
import * as log from 'loglevel';
import marchMadnessRoundService from '../services/MarchMadnessRoundService';

@Component({
    name: 'march-madness-results-component',
})
export default class MarchMadnessResultsComponent extends Vue {
    private results: Results | undefined;


    private data() {
        return {
            results: this.results
        };
    }

    private created() {
        this.start();
    }

    private isViewableRound(round: number) {
        return marchMadnessRoundService.isViewableRound(round);
    }

    private viewableRound() {
        return marchMadnessRoundService.viewableRound();
    }

    private wonInThisRound(choice: Choice, round: number) {
        return choice.winningRounds && choice.winningRounds.length && choice.winningRounds.indexOf(round) >= 0;
    }

    private async start() {
        try {
            const response = await axios.get('/api/march-madness/results');
            this.results = response.data;
        } catch (error) {
            log.warn(`Error getting March Madness results: ${error}`);
        }
    }
}
</script>

<style lang="scss" scoped>
img {
    height: $input-height;
}

thead th {
    text-align: center;
    background-color: $background-color;
}

table td, table th.name {
    white-space: nowrap;
}

th:first-child
{
    position: sticky;
    left: 0px;
}
</style>

